"""DRISHTI AI — Background Training Job Manager & Telemetry Service.

Orchestrates ResNet-50 fine-tuning in a background thread, gathers real-time hardware
telemetry (GPU VRAM, GPU Temp, CPU, RAM), handles graceful cancellation, streams updates
via SSE, and manages model checkpoint promotion/rollback.
"""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional

import torch
import torch.nn as nn
from torch.optim import SGD, Adam, AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

from ml.dataset import audit_dataset, get_data_loaders, prepare_splits
from ml.evaluate import evaluate_checkpoint
from ml.train import build_model, evaluate_epoch, train_epoch

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "artifacts"
CHECKPOINTS_DIR = ARTIFACTS_DIR / "checkpoints"
REGISTRY_FILE = ARTIFACTS_DIR / "model_registry.json"
JOBS_HISTORY_FILE = ARTIFACTS_DIR / "training_jobs.json"


class TrainingManager:
    """Thread-safe orchestrator for background ML training, telemetry, and model promotion."""

    _instance: Optional["TrainingManager"] = None

    def __new__(cls) -> "TrainingManager":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if getattr(self, "_initialized", False):
            return
        self._initialized = True

        CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        self.stop_event = threading.Event()
        self.training_thread: Optional[threading.Thread] = None

        # Current Job State
        self.current_job_id: Optional[str] = None
        self.state: str = "idle"  # idle, preparing, running, stopping, completed, failed, interrupted
        self.error_message: Optional[str] = None
        self.config: Dict[str, Any] = {}
        self.current_epoch: int = 0
        self.total_epochs: int = 0
        self.train_loss: float = 0.0
        self.train_acc: float = 0.0
        self.val_loss: float = 0.0
        self.val_acc: float = 0.0
        self.best_val_acc: float = 0.0
        self.best_epoch: int = 0
        self.learning_rate: float = 0.0
        self.elapsed_seconds: float = 0.0
        self.epoch_duration: float = 0.0
        self.estimated_remaining_seconds: float = 0.0
        self.history: List[Dict[str, Any]] = []
        self.logs: List[Dict[str, str]] = []
        self.detected_classes: List[str] = []
        self.active_checkpoint_path: Optional[str] = None
        self.evaluation_results: Optional[Dict[str, Any]] = None

        # Load persisted registry and jobs state
        self._load_registry()
        self._load_last_job()

    def _log(self, level: str, message: str) -> None:
        """Append timestamped log entry."""
        entry = {
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "level": level,
            "message": message,
        }
        self.logs.append(entry)
        if len(self.logs) > 300:
            self.logs = self.logs[-300:]
        print(f"[{entry['timestamp']}] [{level}] {message}")

    def _load_registry(self) -> None:
        """Load model registry tracking promoted and historical checkpoints."""
        if not REGISTRY_FILE.exists():
            default_reg = {
                "active_model": None,
                "active_version": None,
                "history": [],
            }
            with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
                json.dump(default_reg, f, indent=2)
            self.registry = default_reg
        else:
            try:
                with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                    self.registry = json.load(f)
            except Exception:
                self.registry = {"active_model": None, "active_version": None, "history": []}

    def _save_registry(self) -> None:
        """Persist model registry."""
        with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
            json.dump(self.registry, f, indent=2)

    def _load_last_job(self) -> None:
        """Recover last training job metadata on server restart."""
        if JOBS_HISTORY_FILE.exists():
            try:
                with open(JOBS_HISTORY_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        last = data[-1]
                        self.current_job_id = last.get("job_id")
                        self.state = last.get("state", "idle")
                        if self.state in ["running", "preparing", "stopping"]:
                            self.state = "interrupted"
                        self.config = last.get("config", {})
                        self.current_epoch = last.get("current_epoch", 0)
                        self.total_epochs = last.get("total_epochs", 0)
                        self.train_loss = last.get("train_loss", 0.0)
                        self.train_acc = last.get("train_acc", 0.0)
                        self.val_loss = last.get("val_loss", 0.0)
                        self.val_acc = last.get("val_acc", 0.0)
                        self.best_val_acc = last.get("best_val_acc", 0.0)
                        self.best_epoch = last.get("best_epoch", 0)
                        self.history = last.get("history", [])
                        self.detected_classes = last.get("detected_classes", [])
                        self.evaluation_results = last.get("evaluation_results")
            except Exception as e:
                print(f"Notice: Could not load past training job: {e}")

    def _persist_job(self) -> None:
        """Save current job state to disk."""
        job_data = {
            "job_id": self.current_job_id,
            "state": self.state,
            "config": self.config,
            "current_epoch": self.current_epoch,
            "total_epochs": self.total_epochs,
            "train_loss": self.train_loss,
            "train_acc": self.train_acc,
            "val_loss": self.val_loss,
            "val_acc": self.val_acc,
            "best_val_acc": self.best_val_acc,
            "best_epoch": self.best_epoch,
            "elapsed_seconds": self.elapsed_seconds,
            "history": self.history,
            "detected_classes": self.detected_classes,
            "error_message": self.error_message,
            "evaluation_results": self.evaluation_results,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        jobs = []
        if JOBS_HISTORY_FILE.exists():
            try:
                with open(JOBS_HISTORY_FILE, "r", encoding="utf-8") as f:
                    jobs = json.load(f)
                    if not isinstance(jobs, list):
                        jobs = []
            except Exception:
                jobs = []

        # Replace existing entry or append
        updated = False
        for idx, j in enumerate(jobs):
            if j.get("job_id") == self.current_job_id:
                jobs[idx] = job_data
                updated = True
                break
        if not updated:
            jobs.append(job_data)

        # Keep last 10 jobs
        jobs = jobs[-10:]
        with open(JOBS_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(jobs, f, indent=2)

    def get_system_telemetry(self) -> Dict[str, Any]:
        """Query real-time hardware telemetry (RTX 2050 GPU, CPU, System RAM)."""
        telemetry = {
            "gpu_name": None,
            "gpu_utilization_pct": 0,
            "gpu_temp_c": 0,
            "gpu_memory_used_mb": 0,
            "gpu_memory_total_mb": 0,
            "cpu_utilization_pct": 0.0,
            "ram_used_mb": 0,
            "ram_total_mb": 0,
            "ram_utilization_pct": 0.0,
            "cuda_available": torch.cuda.is_available(),
        }

        # 1. CPU & RAM via psutil
        try:
            import psutil
            telemetry["cpu_utilization_pct"] = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            telemetry["ram_used_mb"] = int(mem.used // (1024 * 1024))
            telemetry["ram_total_mb"] = int(mem.total // (1024 * 1024))
            telemetry["ram_utilization_pct"] = round(mem.percent, 1)
        except Exception:
            pass

        # 2. NVIDIA GPU via nvidia-smi with PyTorch fallback
        if telemetry["cuda_available"]:
            telemetry["gpu_name"] = torch.cuda.get_device_name(0)
            telemetry["gpu_memory_total_mb"] = int(
                torch.cuda.get_device_properties(0).total_memory // (1024 * 1024)
            )
            # PyTorch internal allocation
            telemetry["gpu_memory_used_mb"] = int(
                torch.cuda.memory_allocated(0) // (1024 * 1024)
            )

            # Query nvidia-smi for overall VRAM, utilization, and temperature
            try:
                out = subprocess.check_output(
                    [
                        "nvidia-smi",
                        "--query-gpu=utilization.gpu,temperature.gpu,memory.used",
                        "--format=csv,noheader,nounits",
                    ],
                    timeout=1.5,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                ).decode("utf-8").strip()
                parts = [p.strip() for p in out.split(",")]
                if len(parts) >= 3:
                    telemetry["gpu_utilization_pct"] = int(parts[0])
                    telemetry["gpu_temp_c"] = int(parts[1])
                    telemetry["gpu_memory_used_mb"] = int(parts[2])
            except Exception:
                pass

        return telemetry

    def get_status(self) -> Dict[str, Any]:
        """Return full training status and telemetry."""
        with self.lock:
            telemetry = self.get_system_telemetry()
            return {
                "job_id": self.current_job_id,
                "state": self.state,
                "is_running": self.state in ["preparing", "running", "stopping"],
                "error_message": self.error_message,
                "config": self.config,
                "current_epoch": self.current_epoch,
                "total_epochs": self.total_epochs,
                "train_loss": self.train_loss,
                "train_acc": self.train_acc,
                "val_loss": self.val_loss,
                "val_acc": self.val_acc,
                "best_val_acc": self.best_val_acc,
                "best_epoch": self.best_epoch,
                "learning_rate": self.learning_rate,
                "elapsed_seconds": round(self.elapsed_seconds, 1),
                "epoch_duration": round(self.epoch_duration, 1),
                "estimated_remaining_seconds": round(self.estimated_remaining_seconds, 1),
                "history": self.history,
                "recent_logs": self.logs[-40:],
                "detected_classes": self.detected_classes,
                "telemetry": telemetry,
                "active_model": self.registry.get("active_model"),
                "evaluation_results": self.evaluation_results,
            }

    def start_training(
        self,
        splits_dir: str = "data/splits",
        epochs: int = 15,
        batch_size: int = 16,
        lr: float = 1e-4,
        optimizer_name: str = "AdamW",
        patience: int = 5,
        device_str: str = "cuda:0",
        architecture: str = "ResNet-50",
    ) -> Dict[str, Any]:
        """Initiate background model training if not already active."""
        with self.lock:
            if self.state in ["preparing", "running", "stopping"]:
                raise RuntimeError("A training job is already currently executing.")

            # Validate splits exist
            s_path = Path(splits_dir)
            train_dir = s_path / "train"
            val_dir = s_path / "val"
            if not train_dir.exists() or not val_dir.exists():
                raise ValueError(
                    f"Stratified splits not found in '{splits_dir}'. Prepare dataset splits before training."
                )

            # Reset Job Variables
            self.current_job_id = f"job_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
            self.state = "preparing"
            self.error_message = None
            self.config = {
                "splits_dir": str(splits_dir),
                "epochs": epochs,
                "batch_size": batch_size,
                "lr": lr,
                "optimizer": optimizer_name,
                "patience": patience,
                "device": device_str,
                "architecture": architecture,
            }
            self.current_epoch = 0
            self.total_epochs = epochs
            self.train_loss = 0.0
            self.train_acc = 0.0
            self.val_loss = 0.0
            self.val_acc = 0.0
            self.best_val_acc = 0.0
            self.best_epoch = 0
            self.learning_rate = lr
            self.elapsed_seconds = 0.0
            self.epoch_duration = 0.0
            self.estimated_remaining_seconds = 0.0
            self.history = []
            self.logs = []
            self.evaluation_results = None
            self.stop_event.clear()

            self._log("INFO", f"Initialized training job: {self.current_job_id}")
            self._log("INFO", f"Config: {epochs} epochs, batch size {batch_size}, lr {lr}, device {device_str}")

            self.training_thread = threading.Thread(
                target=self._run_training_worker,
                daemon=True,
                name="DRISHTI-Training-Worker",
            )
            self.training_thread.start()

            self._persist_job()
            return {"status": "started", "job_id": self.current_job_id}

    def stop_training(self) -> Dict[str, Any]:
        """Request cancellation of the active training job."""
        with self.lock:
            if self.state not in ["preparing", "running"]:
                return {"status": "ignored", "message": f"Job is in '{self.state}' state."}

            self.state = "stopping"
            self.stop_event.set()
            self._log("WARNING", "Cancellation requested by user. Terminating after current batch/epoch...")
            self._persist_job()
            return {"status": "stopping", "job_id": self.current_job_id}

    def _run_training_worker(self) -> None:
        """Worker thread executing the training loop."""
        start_time = time.time()
        splits_path = Path(self.config["splits_dir"])
        epochs = self.config["epochs"]
        batch_size = self.config["batch_size"]
        lr = self.config["lr"]
        patience = self.config["patience"]
        opt_name = self.config.get("optimizer", "AdamW")

        # Resolve device
        requested_dev = self.config.get("device", "cuda:0")
        if requested_dev.startswith("cuda") and not torch.cuda.is_available():
            device = torch.device("cpu")
            self._log("WARNING", "CUDA requested but not available. Falling back to CPU.")
        else:
            device = torch.device(requested_dev)

        self._log("INFO", f"Binding training to device: {device}")

        try:
            # 1. Load Data
            self._log("INFO", "Loading dataset partitions...")
            train_loader, val_loader, test_loader, classes = get_data_loaders(
                splits_dir=splits_path, batch_size=batch_size
            )
            self.detected_classes = classes
            num_classes = len(classes)
            self._log("INFO", f"Loaded {num_classes} classes: {classes}")

            # Save classes
            with open(ARTIFACTS_DIR / "classes.json", "w", encoding="utf-8") as f:
                json.dump(classes, f, indent=2)

            # 2. Build Model
            arch = self.config.get("architecture", "ResNet-50")
            self._log("INFO", f"Instantiating {arch} with transfer learning head...")
            model = build_model(num_classes=num_classes, architecture=arch, pretrained=True).to(device)

            criterion = nn.CrossEntropyLoss()

            # Select optimizer
            if opt_name == "SGD":
                optimizer = SGD(model.parameters(), lr=lr, momentum=0.9, weight_decay=1e-4)
            elif opt_name == "Adam":
                optimizer = Adam(model.parameters(), lr=lr, weight_decay=1e-4)
            else:
                optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-2)

            scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
            scaler = torch.amp.GradScaler(enabled=(device.type == "cuda"))

            self.state = "running"
            self._persist_job()

            patience_counter = 0

            # 3. Epoch Loop
            for epoch in range(1, epochs + 1):
                if self.stop_event.is_set():
                    self._log("WARNING", "Training halted via user cancellation.")
                    self.state = "interrupted"
                    break

                t_epoch_start = time.time()
                self.current_epoch = epoch
                self.learning_rate = optimizer.param_groups[0]["lr"]

                # Train Pass
                train_loss, train_acc = train_epoch(
                    model, train_loader, criterion, optimizer, scaler, device
                )

                # Validation Pass
                val_loss, val_acc = evaluate_epoch(model, val_loader, criterion, device)
                scheduler.step()

                t_epoch_end = time.time()
                epoch_sec = t_epoch_end - t_epoch_start
                self.epoch_duration = epoch_sec
                self.elapsed_seconds = t_epoch_end - start_time
                self.train_loss = round(train_loss, 4)
                self.train_acc = round(train_acc, 2)
                self.val_loss = round(val_loss, 4)
                self.val_acc = round(val_acc, 2)

                # Estimate remaining duration
                rem_epochs = max(0, epochs - epoch)
                self.estimated_remaining_seconds = rem_epochs * epoch_sec

                record = {
                    "epoch": epoch,
                    "train_loss": self.train_loss,
                    "train_accuracy": self.train_acc,
                    "val_loss": self.val_loss,
                    "val_accuracy": self.val_acc,
                    "lr": round(self.learning_rate, 6),
                    "epoch_seconds": round(epoch_sec, 2),
                }
                self.history.append(record)

                log_line = (
                    f"Epoch [{epoch:02d}/{epochs:02d}] "
                    f"Train Loss: {self.train_loss:.4f} | Train Acc: {self.train_acc:.1f}% | "
                    f"Val Loss: {self.val_loss:.4f} | Val Acc: {self.val_acc:.1f}% ({epoch_sec:.1f}s)"
                )
                self._log("INFO", log_line)

                # Checkpoint saving if validation accuracy improved
                if val_acc > self.best_val_acc:
                    self.best_val_acc = val_acc
                    self.best_epoch = epoch
                    patience_counter = 0

                    ckpt_filename = f"checkpoint_{self.current_job_id}_epoch{epoch}.pth"
                    job_ckpt_path = CHECKPOINTS_DIR / ckpt_filename
                    canonical_best_path = ARTIFACTS_DIR / "best_model.pth"

                    ckpt_data = {
                        "model_state_dict": model.state_dict(),
                        "classes": classes,
                        "num_classes": num_classes,
                        "architecture": arch,
                        "val_accuracy": self.best_val_acc,
                        "epoch": epoch,
                        "job_id": self.current_job_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }

                    torch.save(ckpt_data, job_ckpt_path)
                    torch.save(ckpt_data, canonical_best_path)
                    self.active_checkpoint_path = str(canonical_best_path)
                    self._log("SUCCESS", f"New best checkpoint saved ({val_acc:.2f}%) -> {ckpt_filename}")
                else:
                    patience_counter += 1
                    if patience_counter >= patience:
                        self._log("INFO", f"Early stopping triggered at epoch {epoch} (patience={patience}).")
                        break

                self._persist_job()

            if not self.stop_event.is_set():
                self.state = "completed"
                self._log("SUCCESS", f"Training job completed in {self.elapsed_seconds:.1f}s. Best Val Acc: {self.best_val_acc:.2f}%.")

        except torch.cuda.OutOfMemoryError as oom:
            self.state = "failed"
            self.error_message = (
                f"CUDA Out of Memory on RTX 2050 (4 GB VRAM). "
                f"Reduce batch size to 8 or 4 and restart. Details: {str(oom)}"
            )
            self._log("ERROR", self.error_message)
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception as exc:
            self.state = "failed"
            self.error_message = f"Training aborted due to error: {str(exc)}"
            self._log("ERROR", self.error_message)
        finally:
            self.stop_event.clear()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            self._persist_job()

    def evaluate_test_set(self, checkpoint_path_str: Optional[str] = None) -> Dict[str, Any]:
        """Run formal evaluation on the held-out test set."""
        target_ckpt = (
            Path(checkpoint_path_str)
            if checkpoint_path_str
            else ARTIFACTS_DIR / "best_model.pth"
        )
        test_dir = Path("data/splits/test")

        if not target_ckpt.exists():
            raise FileNotFoundError(f"Checkpoint not found at {target_ckpt}.")
        if not test_dir.exists():
            raise FileNotFoundError("Test split not found in data/splits/test.")

        self._log("INFO", f"Running evaluation of {target_ckpt.name} on held-out test partition...")
        results = evaluate_checkpoint(checkpoint_path=target_ckpt, test_dir=test_dir)
        self.evaluation_results = results
        self._persist_job()
        self._log("SUCCESS", f"Test evaluation completed. Test Acc: {results['overall_accuracy']}%, Macro F1: {results['macro_f1']}%.")
        return results

    def list_checkpoints(self) -> List[Dict[str, Any]]:
        """List all available checkpoints with validation metrics and active state."""
        ckpts = []
        canonical_best = ARTIFACTS_DIR / "best_model.pth"
        active_model = self.registry.get("active_model")

        # Include canonical best
        if canonical_best.exists():
            try:
                data = torch.load(canonical_best, map_location="cpu", weights_only=False)
                ckpts.append({
                    "filename": "best_model.pth",
                    "path": str(canonical_best),
                    "epoch": data.get("epoch"),
                    "val_accuracy": data.get("val_accuracy"),
                    "classes": data.get("classes", []),
                    "num_classes": data.get("num_classes"),
                    "size_mb": round(canonical_best.stat().st_size / (1024 * 1024), 1),
                    "is_active": (active_model == str(canonical_best)) or (active_model is None),
                    "timestamp": data.get("timestamp"),
                })
            except Exception:
                pass

        # Include versioned checkpoints
        for p in CHECKPOINTS_DIR.glob("*.pth"):
            try:
                data = torch.load(p, map_location="cpu", weights_only=False)
                ckpts.append({
                    "filename": p.name,
                    "path": str(p),
                    "epoch": data.get("epoch"),
                    "val_accuracy": data.get("val_accuracy"),
                    "classes": data.get("classes", []),
                    "num_classes": data.get("num_classes"),
                    "size_mb": round(p.stat().st_size / (1024 * 1024), 1),
                    "is_active": active_model == str(p),
                    "timestamp": data.get("timestamp"),
                })
            except Exception:
                pass

        return ckpts

    def promote_checkpoint(self, checkpoint_path_str: str) -> Dict[str, Any]:
        """Promote a specific checkpoint to become the active production inference model."""
        target_path = Path(checkpoint_path_str)
        if not target_path.exists():
            raise FileNotFoundError(f"Checkpoint {target_path} does not exist.")

        # Verify checkpoint validity
        try:
            data = torch.load(target_path, map_location="cpu", weights_only=False)
            if "model_state_dict" not in data or "classes" not in data:
                raise ValueError("Checkpoint is corrupted or missing required keys.")
        except Exception as e:
            raise ValueError(f"Invalid checkpoint format: {e}")

        # Update registry
        previous_model = self.registry.get("active_model")
        version_tag = f"v{len(self.registry.get('history', [])) + 1}"

        entry = {
            "version": version_tag,
            "path": str(target_path),
            "promoted_at": datetime.now(timezone.utc).isoformat(),
            "val_accuracy": data.get("val_accuracy"),
            "epoch": data.get("epoch"),
            "classes": data.get("classes"),
            "previous_model": previous_model,
        }

        self.registry["active_model"] = str(target_path)
        self.registry["active_version"] = version_tag
        self.registry.setdefault("history", []).append(entry)
        self._save_registry()

        # Update canonical best_model.pth if different
        canonical_best = ARTIFACTS_DIR / "best_model.pth"
        if target_path != canonical_best:
            try:
                torch.save(data, canonical_best)
            except Exception:
                pass

        self._log("SUCCESS", f"Promoted checkpoint {target_path.name} to active model ({version_tag}).")
        return {
            "status": "promoted",
            "active_model": str(target_path),
            "version": version_tag,
            "val_accuracy": data.get("val_accuracy"),
        }


# Singleton instance
training_manager = TrainingManager()

package ai.drishti.currency;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.util.HashMap;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "NiraNativeTTS";
    private NativeTTSBridge ttsBridge;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ttsBridge = new NativeTTSBridge(this);
        configureWebViewSettings();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebViewSettings();
    }

    @Override
    public void onDestroy() {
        if (ttsBridge != null) {
            ttsBridge.shutdown();
        }
        super.onDestroy();
    }

    private void configureWebViewSettings() {
        try {
            if (getBridge() != null) {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    WebSettings settings = webView.getSettings();
                    // Enable mixed content so local WebView can communicate with laptop HTTP backend over LAN Wi-Fi
                    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                    settings.setDomStorageEnabled(true);
                    settings.setDatabaseEnabled(true);
                    settings.setMediaPlaybackRequiresUserGesture(false);

                    // Register Native Android TTS Javascript Bridge
                    webView.addJavascriptInterface(ttsBridge, "NativeTTS");
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Notice during configureWebViewSettings: " + e.getMessage());
        }
    }

    /**
     * Native Android TextToSpeech Bridge exposing high-fidelity hardware audio
     * directly to the NIRA React application.
     *
     * Audio focus is requested before each utterance (AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
     * and released when the utterance completes or errors, preventing TTS from being
     * silenced by background media and ensuring clear accessibility speech output.
     */
    public class NativeTTSBridge implements TextToSpeech.OnInitListener {
        private final Context context;
        private TextToSpeech tts;
        private boolean isInitialized = false;
        private final Handler mainHandler = new Handler(Looper.getMainLooper());
        private AudioManager audioManager;
        private AudioFocusRequest focusRequest;
        private final AudioAttributes ttsAudioAttributes;

        public NativeTTSBridge(Context context) {
            this.context = context;
            this.audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);

            // Build AudioAttributes once for reuse across TTS and audio focus
            this.ttsAudioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();

            try {
                this.tts = new TextToSpeech(context.getApplicationContext(), this);
            } catch (Exception e) {
                Log.e(TAG, "Failed to instantiate TextToSpeech: " + e.getMessage());
            }
        }

        @Override
        public void onInit(int status) {
            if (status == TextToSpeech.SUCCESS) {
                isInitialized = true;
                Log.i(TAG, "Native Android TextToSpeech initialized successfully.");

                // Configure AudioAttributes for accessibility speech stream
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    tts.setAudioAttributes(ttsAudioAttributes);
                }

                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override
                    public void onStart(String utteranceId) {
                        Log.d(TAG, "Utterance started: " + utteranceId);
                    }

                    @Override
                    public void onDone(String utteranceId) {
                        Log.d(TAG, "Utterance completed: " + utteranceId);
                        releaseAudioFocus();
                        notifyJsUtteranceEnd(utteranceId, true);
                    }

                    @Override
                    public void onError(String utteranceId) {
                        Log.w(TAG, "Utterance error: " + utteranceId);
                        releaseAudioFocus();
                        notifyJsUtteranceEnd(utteranceId, false);
                    }
                });
            } else {
                Log.e(TAG, "TextToSpeech initialization failed with code: " + status);
                isInitialized = false;
            }
        }

        /**
         * Request transient audio focus with ducking so other audio (e.g. media)
         * lowers its volume while NIRA speaks, and speech is routed through the
         * accessibility audio stream at full device volume.
         */
        private void requestAudioFocus() {
            if (audioManager == null) return;
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                            .setAudioAttributes(ttsAudioAttributes)
                            .setOnAudioFocusChangeListener(focusChange -> {
                                // No-op: transient focus, we just need other apps to duck
                            })
                            .build();
                    audioManager.requestAudioFocus(focusRequest);
                } else {
                    audioManager.requestAudioFocus(
                            focusChange -> { /* no-op */ },
                            AudioManager.STREAM_MUSIC,
                            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
                    );
                }
            } catch (Exception e) {
                Log.w(TAG, "Audio focus request failed: " + e.getMessage());
            }
        }

        /**
         * Release audio focus after utterance completes or errors.
         */
        private void releaseAudioFocus() {
            if (audioManager == null) return;
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
                    audioManager.abandonAudioFocusRequest(focusRequest);
                    focusRequest = null;
                } else {
                    audioManager.abandonAudioFocus(null);
                }
            } catch (Exception e) {
                Log.w(TAG, "Audio focus release failed: " + e.getMessage());
            }
        }

        private void notifyJsUtteranceEnd(final String utteranceId, final boolean success) {
            mainHandler.post(() -> {
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        String js = "if (window.__onNativeTTSEnd) { window.__onNativeTTSEnd('" + utteranceId + "', " + success + "); }";
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                            getBridge().getWebView().evaluateJavascript(js, null);
                        } else {
                            getBridge().getWebView().loadUrl("javascript:" + js);
                        }
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Error notifying JS callback: " + e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public boolean isReady() {
            return isInitialized && tts != null;
        }

        @JavascriptInterface
        public boolean isLanguageSupported(String langCode) {
            if (!isInitialized || tts == null) return false;
            Locale locale = resolveLocale(langCode);
            int res = tts.isLanguageAvailable(locale);
            return res == TextToSpeech.LANG_AVAILABLE ||
                   res == TextToSpeech.LANG_COUNTRY_AVAILABLE ||
                   res == TextToSpeech.LANG_COUNTRY_VAR_AVAILABLE;
        }

        @JavascriptInterface
        public boolean speak(String text, String langCode, float speechRate, String utteranceId) {
            if (!isInitialized || tts == null) {
                Log.w(TAG, "TTS requested but engine is not yet ready.");
                return false;
            }

            try {
                Locale locale = resolveLocale(langCode);
                int langResult = tts.setLanguage(locale);
                if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.w(TAG, "Language " + langCode + " not supported or missing voice data. Code: " + langResult);
                    return false;
                }

                tts.setSpeechRate(speechRate > 0 ? speechRate : 1.0f);
                tts.setPitch(1.0f);

                // Request audio focus before speaking so other audio ducks
                requestAudioFocus();

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    // Use AudioAttributes-based speak (no KEY_PARAM_STREAM override)
                    Bundle params = new Bundle();
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
                } else {
                    HashMap<String, String> params = new HashMap<>();
                    params.put(TextToSpeech.Engine.KEY_PARAM_STREAM, String.valueOf(AudioManager.STREAM_MUSIC));
                    params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, params);
                }
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Exception during native speak: " + e.getMessage());
                releaseAudioFocus();
                return false;
            }
        }

        @JavascriptInterface
        public void stop() {
            if (tts != null) {
                try {
                    tts.stop();
                    releaseAudioFocus();
                } catch (Exception ignored) {}
            }
        }

        public void shutdown() {
            if (tts != null) {
                try {
                    tts.stop();
                    tts.shutdown();
                    releaseAudioFocus();
                } catch (Exception ignored) {}
                tts = null;
                isInitialized = false;
            }
        }

        private Locale resolveLocale(String langCode) {
            if (langCode == null) return new Locale("en", "IN");
            String lower = langCode.toLowerCase().trim();
            if (lower.startsWith("ta")) {
                return new Locale("ta", "IN");
            } else if (lower.startsWith("hi")) {
                return new Locale("hi", "IN");
            } else {
                return new Locale("en", "IN");
            }
        }
    }
}

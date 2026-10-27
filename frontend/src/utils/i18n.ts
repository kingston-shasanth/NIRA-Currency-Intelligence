/**
 * NIRA — Comprehensive Indian Language & Speech Translation Engine.
 *
 * Primary Indian languages: English, தமிழ் (Tamil), हिन्दी (Hindi).
 * Extended Indian languages: Telugu, Kannada, Malayalam, Bengali,
 * Marathi, Gujarati, Punjabi, Odia, Urdu, Assamese.
 */

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
  isPrimary: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // Primary Languages
  { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-IN', isPrimary: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN', isPrimary: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN', isPrimary: true },
  // Extended Indian Languages
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN', isPrimary: false },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN', isPrimary: false },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN', isPrimary: false },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN', isPrimary: false },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN', isPrimary: false },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechCode: 'gu-IN', isPrimary: false },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN', isPrimary: false },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', speechCode: 'or-IN', isPrimary: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', speechCode: 'ur-IN', isPrimary: false },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', speechCode: 'as-IN', isPrimary: false },
];

export const PRIMARY_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.isPrimary);

// Natural spoken denomination names across all 14 canonical classes
export const SPOKEN_DENOMINATIONS: Record<string, Record<string, string>> = {
  '₹10': {
    en: 'ten-rupee note',
    ta: 'பத்து ரூபாய் நோட்டு',
    hi: 'दस रुपये का नोट',
    te: 'పది రూపాయల నోటు',
    kn: 'ಹತ್ತು ರೂಪಾಯಿ ನೋಟು',
    ml: 'പത്ത് രൂപ നോട്ട്',
    bn: 'দশ টাকার নোট',
    mr: 'दहा रुपयांची नोट',
    gu: 'દસ રૂપિયાની નોટ',
    pa: 'ਦਸ ਰੁਪਏ ਦਾ ਨੋਟ',
    or: 'ଦଶ ଟଙ୍କା ନୋଟ୍',
    ur: 'دس روپے کا نوٹ',
    as: 'দহ টকীয়া নোট',
  },
  '₹20': {
    en: 'twenty-rupee note',
    ta: 'இருபது ரூபாய் நோட்டு',
    hi: 'बीस रुपये का नोट',
    te: 'ఇరవై రూపాయల నోటు',
    kn: 'ಇಪ್ಪತ್ತು ರೂಪಾಯಿ ನೋಟು',
    ml: 'ഇരുപത് രൂപ നോട്ട്',
    bn: 'কুড়ি টাকার নোট',
    mr: 'वीस रुपयांची नोट',
    gu: 'વીસ રૂપિયાની નોટ',
    pa: 'ਵੀਹ ਰੁਪਏ ਦਾ ਨੋਟ',
    or: 'କୋଡ଼ିଏ ଟଙ୍କା ନୋଟ୍',
    ur: 'بیس روپے کا نوٹ',
    as: 'বিছ টকীয়া নোট',
  },
  '₹50': {
    en: 'fifty-rupee note',
    ta: 'ஐம்பது ரூபாய் நோட்டு',
    hi: 'पचास रुपये का नोट',
    te: 'యాభై రూపాయల నోటు',
    kn: 'ಐವತ್ತು ರೂಪಾಯಿ ನೋಟು',
    ml: 'അമ്പത് രൂപ നോട്ട്',
    bn: 'পঞ্চাশ টাকার নোট',
    mr: 'पन्नास रुपयांची नोट',
    gu: 'પચાસ રૂપિયાની નોટ',
    pa: 'ਪੰਜਾਹ ਰੁਪਏ ਦਾ ਨੋਟ',
    or: 'ପଚାଶ ଟଙ୍କା ନୋଟ୍',
    ur: 'پچاس روپے کا نوٹ',
    as: 'পঞ্চাশ টকীয়া নোট',
  },
  '₹100': {
    en: 'hundred-rupee note',
    ta: 'நூறு ரூபாய் நோட்டு',
    hi: 'सौ रुपये का नोट',
    te: 'వంద రూపాయల నోటు',
    kn: 'ನೂರು ರೂಪಾಯಿ ನೋಟು',
    ml: 'നൂറു രൂപ നോട്ട്',
    bn: 'একশত টাকার নোট',
    mr: 'शंभर रुपयांची नोट',
    gu: 'સો રૂપિયાની નોટ',
    pa: 'ਇੱਕ ਸੌ ਰੁਪਏ ਦਾ ਨੋਟ',
    or: 'ଶହେ ଟଙ୍କା ନୋଟ୍',
    ur: 'ایک سو روپے کا نوٹ',
    as: 'এশ টকীয়া নোট',
  },
  '₹200': {
    en: 'two-hundred-rupee note',
    ta: 'இருநூறு ரூபாய் நோட்டு',
    hi: 'दो सौ रुपये का नोट',
    te: 'రెండు వందల రూపాయల నోటు',
    kn: 'இருನೂರು ರೂಪಾಯಿ ನೋಟು',
    ml: 'ഇരുനൂറു രൂപ നോട്ട്',
    bn: 'দুইশত টাকার নোট',
    mr: 'दोनशे रुपयांची नोट',
    gu: 'બસો રૂપિયાની નોટ',
    pa: 'ਦੋ ਸੌ ਰੁਪਏ ਦਾ ਨੋਟ',
    or: 'ଦୁଇ ଶହ ଟଙ୍କା ନୋଟ୍',
    ur: 'दो सो रुपये का नोट',
    as: 'দুশ টকীয়া নোট',
  },
  '₹500': {
    en: 'five-hundred-rupee note',
    ta: 'ஐநூறு ரூபாய் நோட்டு',
    hi: 'पाँच सौ रुपये का नोट',
    te: 'ఐదు వందల రూపాయల నోటు',
    kn: 'ಐದು ನೂರು ರೂಪಾಯಿ ನೋಟು',
    ml: 'അഞ്ഞൂറു രൂപ നോട്ട്',
    bn: 'পাঁচশত টাকার নোট',
    mr: 'पाचशे रुपयांची नोट',
    gu: 'પાંચસો રૂપિયાની નોટ',
    pa: 'ਪੰਜ ਸੌ ਰੁਪਏ ਦਾ ਨੋਟ',
    or: 'ପାଞ୍ଚ ଶହ ଟଙ୍କା ନୋଟ୍',
    ur: 'پانچ سو روپے کا نوٹ',
    as: 'পাঁচশ টকীয়া নোট',
  },
  '₹2000': {
    en: 'two-thousand-rupee note',
    ta: 'இரண்டாயிரம் ரூபாய் நோட்டு',
    hi: 'दो हज़ार रुपये का नोट',
    te: 'రెండు వేల రూపాయల నోటు',
    kn: 'ಎರಡು ಸಾವಿರ ರೂಪಾಯಿ ನೋಟು',
    ml: 'രണ്ടായിരം രൂപ നോട്ട്',
    bn: 'দুই হাজার টাকার নোট',
    mr: 'दोन हजार रुपयांची नोट',
    gu: 'બે હજાર રૂપિયાની નોટ',
    pa: 'ਦੋ ਹਜ਼ਾਰ ਰੁਪਏ ਦਾ ਨੋਟ',
    or: 'ଦୁଇ ହଜାର ଟଙ୍କା ନୋଟ୍',
    ur: 'دو ہزار روپے کا نوٹ',
    as: 'দুহেজাৰ টকীয়া নোট',
  },
  '₹1 Coin': {
    en: 'one-rupee coin',
    ta: 'ரூபாய் நாணயம்',
    hi: 'रुपये का सिक्का',
    te: 'ఒక రూపాయి నాణెం',
    kn: 'ಒಂದು ರೂಪಾಯಿ ನಾಣ್ಯ',
    ml: 'ഒരു രൂപ നാണയം',
    bn: 'এক টাকার মুদ্রা',
    mr: 'एक रुपयाचे नाणे',
    gu: 'એક રૂપિયાનો સિક્કો',
    pa: 'ਇੱਕ ਰੁਪਏ ਦਾ ਸਿੱਕਾ',
    or: 'ଏକ ଟଙ୍କା ମୁଦ୍ରା',
    ur: 'ایک روپے کا سکہ',
    as: 'এক টকীয়া মুদ্ৰা',
  },
  '₹2 Coin': {
    en: 'two-rupee coin',
    ta: 'இரண்டு ரூபாய் நாணயம்',
    hi: 'दो रुपये का सिक्का',
    te: 'రెండు రూపాయల నాణెం',
    kn: 'ಎರಡು ರೂಪಾಯಿ ನಾಣ್ಯ',
    ml: 'രണ്ടു രൂപ നാണയം',
    bn: 'দুই টাকার মুদ্রা',
    mr: 'दोन रुपयांचे नाणे',
    gu: 'બે રૂપિયાનો સિક્કો',
    pa: 'ਦੋ ਰੁਪਏ ਦਾ ਸਿੱਕਾ',
    or: 'ଦୁଇ ଟଙ୍କା ମୁଦ୍ରା',
    ur: 'دو روپے کا سکہ',
    as: 'দুই টকীয়া মুদ্ৰা',
  },
  '₹5 Coin': {
    en: 'five-rupee coin',
    ta: 'ஐந்து ரூபாய் நாணயம்',
    hi: 'पाँच रुपये का सिक्का',
    te: 'ఐదు రూపాయల నాణెం',
    kn: 'ಐದು ರೂಪಾಯಿ ನಾಣ್ಯ',
    ml: 'അഞ്ച് രൂപ നാണയം',
    bn: 'পাঁচ টাকার মুদ্রা',
    mr: 'पाच रुपयांचे नाणे',
    gu: 'પાંચ રૂપિયાનો સિક્કો',
    pa: 'ਪੰਜ ਰੁਪਏ ਦਾ ਸਿੱਕਾ',
    or: 'ପାଞ୍ଚ ଟଙ୍କା ମୁଦ୍ରା',
    ur: 'پانچ روپے کا سکہ',
    as: 'পাঁচ টকীয়া মুদ্ৰা',
  },
  '₹10 Coin': {
    en: 'ten-rupee coin',
    ta: 'பத்து ரூபாய் நாணயம்',
    hi: 'दस रुपये का सिक्का',
    te: 'పది రూపాయల నాణెం',
    kn: 'ಹತ್ತು ರೂಪಾಯಿ ನಾಣ್ಯ',
    ml: 'പത്ത് രൂപ നാണയം',
    bn: 'দশ টাকার মুদ্রা',
    mr: 'दहा रुपयांचे नाणे',
    gu: 'દસ રૂપિયાનો સિક્કો',
    pa: 'ਦਸ ਰੁਪਏ ਦਾ ਸਿੱਕਾ',
    or: 'ଦଶ ଟଙ୍କା ମୁଦ୍ରା',
    ur: 'دس روپے کا سکہ',
    as: 'দহ টকীয়া মুদ্ৰা',
  },
  '₹20 Coin': {
    en: 'twenty-rupee coin',
    ta: 'இருபது ரூபாய் நாணயம்',
    hi: 'बीस रुपये का सिक्का',
    te: 'ఇరవై రూపాయల నాణెం',
    kn: 'ಇಪ್ಪತ್ತು ರೂಪಾಯಿ ನಾಣ್ಯ',
    ml: 'இருபത് രൂപ നാണയം',
    bn: 'কুড়ি টাকার মুদ্রা',
    mr: 'वीस रुपयांचे नाणे',
    gu: 'વીસ રૂપિયાનો સિક્કો',
    pa: 'ਵੀਹ ਰੁਪਏ ਦਾ ਸਿੱਕਾ',
    or: 'କୋଡ଼ିଏ ଟଙ୍କା ମୁଦ୍ରା',
    ur: 'بیس روپے کا سکہ',
    as: 'বিছ টকীয়া মুদ্ৰা',
  },
  '25 Paisa Coin': {
    en: 'twenty-five paisa coin',
    ta: 'இருபத்தைந்து காசு நாணயம்',
    hi: 'पच्चीस पैसे का सिक्का',
    te: 'ఇరవై ఐదు పైసల నాణెం',
    kn: 'ಇಪ್ಪತ್ತೈದು ಪೈಸೆ ನಾಣ್ಯ',
    ml: 'இருപத்தഞ്ച് പൈസ നാണയം',
    bn: 'পঁচিশ পয়সার মুদ্রা',
    mr: 'पंचवीस पैशांचे नाणे',
    gu: 'પચ્ચીસ પૈસાનો સિક્કો',
    pa: 'ਪੱਚੀ ਪੈਸੇ ਦਾ ਸਿੱਕਾ',
    or: 'ପଚିଶ ପଇସା ମୁଦ୍ରା',
    ur: 'پچیس پیسے کا سکہ',
    as: 'পঁচিশ পইচাৰ মুদ্ৰা',
  },
  '50 Paisa Coin': {
    en: 'fifty paisa coin',
    ta: 'ஐம்பது காசு நாணயம்',
    hi: 'पचास पैसे का सिक्का',
    te: 'యాభై పైసల నాణెం',
    kn: 'ಐವತ್ತು ಪೈಸೆ ನಾಣ್ಯ',
    ml: 'അമ്പത് പൈസ നാണയം',
    bn: 'পঞ্চাশ পয়সার মুদ্রা',
    mr: 'पन्नास पैशांचे नाणे',
    gu: 'પચાસ પૈસાનો સિક્કો',
    pa: 'ਪੰਜਾਹ ਪੈਸੇ ਦਾ ਸਿੱਕਾ',
    or: 'ପଚାଶ ପଇସା ମୁଦ୍ରା',
    ur: 'پچاس پیسے کا سکہ',
    as: 'পঞ্চাশ পইচাৰ মুদ্ৰা',
  },
};

// Spoken workflow phrases
export interface WorkflowPhrases {
  greeting: (name?: string) => string;
  firstLaunchGreeting: (name?: string) => string;
  returningGreeting: (name?: string) => string;
  cameraReady: string;
  holdOverCurrency: string;
  currencyDetected: string;
  identifyingCurrency: string;
  successRecognition: (denom: string, confPct: string) => string;
  successFullAnnouncement: (denom: string, isCoin: boolean, confPct: number) => string;
  denominationAnnouncement: (spokenDenom: string) => string;
  naturalAnnouncement: (spokenDenom: string, count?: number) => string;
  nonCurrencyRejection: string;
  rejectedGuidance: string;
  rejectedUiTitle: string;
  rejectedUiNotice: string;
  languageSelectedConfirm: string;
  statusActive: string;
  statusWithdrawn2000: string;
  statusWithdrawn25p: string;
  statusLimited50p: string;
  readyForNext: string;
  uncertainRecognition: string;
  serverOffline: string;
  serverConnected: string;
  tapToScan: string;
  voiceUnavailableNotice: string;
  cameraPermissionNeeded: string;
  cameraPermissionDenied: string;
}

export const WORKFLOW_PHRASES: Record<string, WorkflowPhrases> = {
  en: {
    greeting: (name) =>
      name
        ? `Hello, ${name}. Welcome to NIRA, your Indian currency assistant.`
        : 'Welcome to NIRA, your Indian currency assistant.',
    firstLaunchGreeting: (name) =>
      name
        ? `Hello, ${name}. Welcome to NIRA. I am ready to help identify Indian banknotes and coins. Point the camera towards a note or coin and tap to scan.`
        : 'Welcome to NIRA. I am ready to help identify Indian banknotes and coins. Point the camera towards a note or coin and tap to scan.',
    returningGreeting: (name) =>
      name
        ? `Welcome back, ${name}. Scanner is ready. Tap the screen to scan a note or coin.`
        : 'Welcome back to NIRA. Scanner is ready. Tap the screen to scan a note or coin.',
    cameraReady: 'Camera is ready. Tap the screen to scan a note or coin.',
    holdOverCurrency: 'Point the camera towards a note or coin and tap to scan.',
    currencyDetected: 'Currency detected. Identifying your currency.',
    identifyingCurrency: 'Identifying your currency.',
    successRecognition: (denom, confPct) =>
      `This is an Indian ${denom}. Model confidence is ${confPct}.`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `This is a ${denom}. Confidence: ${confPct} percent.`,
    denominationAnnouncement: (spokenDenom) => {
      const clean = spokenDenom.replace(/^indian /i, '');
      return `This is a ${clean}.`;
    },
    naturalAnnouncement: (spokenDenom) => {
      const clean = spokenDenom.replace(/^indian /i, '');
      return `This is a ${clean}.`;
    },
    nonCurrencyRejection: 'Not a currency item. Please show an Indian note or coin.',
    rejectedGuidance:
      "I couldn't identify a currency note or coin. Please place the currency clearly in view and tap the screen to scan again.",
    rejectedUiTitle: 'Nothing identified.',
    rejectedUiNotice: 'Please show the currency clearly and tap anywhere in the scan area to try again.',
    languageSelectedConfirm:
      "You've selected English as your assistant language. Tap the screen to scan an Indian currency note or coin.",
    statusActive: 'This denomination is reported as currently circulating legal tender.',
    statusWithdrawn2000:
      'Notice: The 2000-rupee note was withdrawn by the RBI and is valid for RBI exchange only.',
    statusWithdrawn25p:
      'Notice: 25 paisa coins ceased to be legal tender on June 30, 2011.',
    statusLimited50p: 'This 50 paisa coin is legal tender for payments up to ten rupees.',
    readyForNext: 'Ready for the next note or coin.',
    uncertainRecognition:
      "I couldn't identify a currency note or coin. Please place the currency clearly in view and tap the screen to scan again.",
    serverOffline:
      'I cannot reach the recognition server. Please reconnect to your laptop server or try again later.',
    serverConnected: 'NIRA server connected. Scanner is ready.',
    tapToScan: 'Tap anywhere on the screen to scan currency.',
    voiceUnavailableNotice:
      'Voice is not installed for this language on your device. Please install voice data in text-to-speech settings.',
    cameraPermissionNeeded:
      'NIRA needs camera access to recognize currency notes and coins. Please allow camera permission.',
    cameraPermissionDenied:
      'Camera permission was not granted. You can upload photos using the Gallery button below or enable camera in your settings.',
  },
  ta: {
    greeting: (name) =>
      name
        ? `வணக்கம், ${name}. நீரா இந்திய ரூபாய் உதவியாளருக்கு நல்வரவு.`
        : 'நீரா இந்திய ரூபாய் உதவியாளருக்கு நல்வரவு.',
    firstLaunchGreeting: (name) =>
      name
        ? `வணக்கம், ${name}. நீரா செயலிக்கு நல்வரவு. இந்திய ரூபாய் நோட்டுகள் மற்றும் நாணயங்களை அடையாளம் காண நான் தயாராக உள்ளேன். திரையைத் தட்டி ஸ்கேன் செய்யவும்.`
        : 'நீரா செயலிக்கு நல்வரவு. இந்திய ரூபாய் நோட்டுகள் மற்றும் நாணயங்களை அடையாளம் காண நான் தயாராக உள்ளேன். திரையைத் தட்டி ஸ்கேன் செய்யவும்.',
    returningGreeting: (name) =>
      name
        ? `வணக்கம், ${name}. ஸ்கேனர் தயாராக உள்ளது.`
        : 'நீரா ஸ்கேனர் தயாராக உள்ளது.',
    cameraReady: 'கேமரா தயாராக உள்ளது. திரையைத் தட்டி ஸ்கேன் செய்யவும்.',
    holdOverCurrency: 'ரூபாய் நோட்டு அல்லது நாணயத்தின் மேல் காட்டி திரையைத் தட்டவும்.',
    currencyDetected: 'பணம் கண்டறியப்பட்டது. அடையாளம் காணப்படுகிறது.',
    identifyingCurrency: 'பணம் அடையாளம் காணப்படுகிறது.',
    successRecognition: (denom, confPct) =>
      `இது ${denom}. மாதிரியின் நம்பிக்கை ${confPct}.`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `இது ${denom}. நம்பகத்தன்மை ${confPct} சதவீதம்.`,
    denominationAnnouncement: (spokenDenom) => `இது ${spokenDenom}.`,
    naturalAnnouncement: (spokenDenom) => `இது ${spokenDenom}.`,
    nonCurrencyRejection: 'பண நோட்டையோ நாணயத்தையோ அடையாளம் காண முடியவில்லை.',
    rejectedGuidance:
      'பண நோட்டையோ நாணயத்தையோ அடையாளம் காண முடியவில்லை. தயவுசெய்து பணத்தைத் தெளிவாகக் காட்டி, மீண்டும் ஸ்கேன் செய்யத் திரையைத் தட்டவும்.',
    rejectedUiTitle: 'அடையாளம் காணப்படவில்லை.',
    rejectedUiNotice: 'பணத்தைத் தெளிவாகக் காட்டி, மீண்டும் முயற்சிக்க ஸ்கேன் பகுதியில் எங்கு வேண்டுமானாலும் தொடவும்.',
    languageSelectedConfirm:
      'உதவியாளர் மொழியாகத் தமிழைத் தேர்ந்தெடுத்துள்ளீர்கள். இந்திய ரூபாய் நோட்டு அல்லது நாணயத்தை ஸ்கேன் செய்யத் திரையைத் தட்டவும்.',
    statusActive: 'இந்த ரூபாய் நோட்டு செல்லுபடியாகும் பணப்பரிவர்த்தனைக்கு உரியது.',
    statusWithdrawn2000:
      'முக்கிய அறிவிப்பு: ₹2000 நோட்டு ரிசர்வ் வங்கியால் புழக்கத்திலிருந்து திரும்பப் பெறப்பட்டது.',
    statusWithdrawn25p: 'அறிவிப்பு: 25 காசு நாணயங்கள் ஜூன் 30, 2011 முதல் செல்லாதவை.',
    statusLimited50p: '50 காசு நாணயம் பத்து ரூபாய் வரை மட்டுமே செலுத்த செல்லுபடியாகும்.',
    readyForNext: 'அடுத்த நோட்டு அல்லது நாணயத்திற்குத் தயார்.',
    uncertainRecognition:
      'பண நோட்டையோ நாணயத்தையோ அடையாளம் காண முடியவில்லை. தயவுசெய்து பணத்தைத் தெளிவாகக் காட்டி, மீண்டும் ஸ்கேன் செய்யத் திரையைத் தட்டவும்.',
    serverOffline:
      'சேவையகத்தை தொடர்பு கொள்ள முடியவில்லை. லேப்டாப் வைஃபை இணைப்பை சரிபார்க்கவும்.',
    serverConnected: 'நீரா சேவையகம் இணைக்கப்பட்டது. ஸ்கேனர் தயார்.',
    tapToScan: 'பணத்தை ஸ்கேன் செய்ய திரையில் எங்கு வேண்டுமானாலும் தொடவும்.',
    voiceUnavailableNotice:
      'இந்த சாதனத்தில் தமிழ் குரல் கிடைக்கவில்லை. ஆண்ட்ராய்டு அமைப்புகளில் தமிழ் குரல் பேக்கைப் பதிவிறக்கவும்.',
    cameraPermissionNeeded:
      'பணத்தை அடையாளம் காண கேமரா அனுமதி தேவை. தயவுசெய்து கேமரா அனுமதியை வழங்கவும்.',
    cameraPermissionDenied:
      'கேமரா அனுமதி மறுக்கப்பட்டது. கேலரி மூலம் படம் பதிவேற்றலாம் அல்லது அமைப்புகளில் அனுமதியை இயக்கலாம்.',
  },
  hi: {
    greeting: (name) =>
      name
        ? `नमस्ते, ${name}। नीरा भारतीय मुद्रा सहायक में आपका स्वागत है।`
        : 'नीरा भारतीय मुद्रा सहायक में आपका स्वागत है।',
    firstLaunchGreeting: (name) =>
      name
        ? `नमस्ते, ${name}। नीरा में आपका स्वागत है। मैं भारतीय नोटों और सिक्कों की पहचान के लिए तैयार हूँ। स्क्रीन पर टैप करके स्कैन करें।`
        : 'नीरा में आपका स्वागत है। मैं भारतीय नोटों और सिक्कों की पहचान के लिए तैयार हूँ। स्क्रीन पर टैप करके स्कैन करें।',
    returningGreeting: (name) =>
      name
        ? `नमस्ते, ${name}। स्कैनर तैयार है।`
        : 'नीरा स्कैनर तैयार है।',
    cameraReady: 'कैमरा तैयार है। स्क्रीन पर टैप करके स्कैन करें।',
    holdOverCurrency: 'कैमरे को नोट या सिक्के के सामने लाएं और टैप करें।',
    currencyDetected: 'मुद्रा दिखाई दी है। पहचान की जा रही है।',
    identifyingCurrency: 'मुद्रा की पहचान की जा रही है।',
    successRecognition: (denom, confPct) =>
      `यह ${denom} है। मॉडल की सटीकता ${confPct} है।`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `यह ${denom} है। विश्वास स्तर ${confPct} प्रतिशत.`,
    denominationAnnouncement: (spokenDenom) => `यह ${spokenDenom} है।`,
    naturalAnnouncement: (spokenDenom) => `यह ${spokenDenom} है।`,
    nonCurrencyRejection: 'मैं नोट या सिक्के की पहचान नहीं कर पाया।',
    rejectedGuidance:
      'मैं नोट या सिक्के की पहचान नहीं कर पाया। कृपया मुद्रा को साफ़ तरीके से दिखाएँ और दोबारा स्कैन करने के लिए स्क्रीन पर टैप करें।',
    rejectedUiTitle: 'पहचान नहीं हो सकी।',
    rejectedUiNotice: 'कृपया मुद्रा को साफ़ दिखाएँ और पुनः प्रयास करने के लिए स्कैन क्षेत्र में कहीं भी टैप करें।',
    languageSelectedConfirm:
      'आपने सहायक की भाषा हिंदी चुनी है। भारतीय मुद्रा के नोट या सिक्के को स्कैन करने के लिए स्क्रीन पर टैप करें।',
    statusActive: 'यह मुद्रा संचलन में पूरी तरह से वैध है।',
    statusWithdrawn2000:
      'सूचना: ₹2000 का नोट आरबीआई द्वारा संचलन से वापस लिया जा चुका है।',
    statusWithdrawn25p: 'सूचना: 25 पैसे का सिक्का 30 जून 2011 से अमान्य हो चुका है।',
    statusLimited50p: '50 पैसे का सिक्का दस रुपये तक के भुगतान के लिए वैध है।',
    readyForNext: 'अगले नोट या सिक्के के लिए तैयार।',
    uncertainRecognition:
      'मैं नोट या सिक्के की पहचान नहीं कर पाया। कृपया मुद्रा को साफ़ तरीके से दिखाएँ और दोबारा स्कैन करने के लिए स्क्रीन पर टैप करें।',
    serverOffline:
      'सर्वर से संपर्क नहीं हो पा रहा है। कृपया लैपटॉप कनेक्शन की जाँच करें।',
    serverConnected: 'नीरा सर्वर कनेक्ट हो गया है। स्कैनर तैयार है।',
    tapToScan: 'मुद्रा स्कैन करने के लिए स्क्रीन पर कहीं भी टैप करें।',
    voiceUnavailableNotice:
      'इस डिवाइस पर हिंदी आवाज़ उपलब्ध नहीं है। कृपया सेटिंग्स में हिंदी वॉयस पैक इंस्टॉल करें।',
    cameraPermissionNeeded:
      'मुद्रा पहचानने के लिए कैमरा अनुमति आवश्यक है। कृपया कैमरा अनुमति दें।',
    cameraPermissionDenied:
      'कैमरा अनुमति अस्वीकार कर दी गई। आप गैलरी से फोटो अपलोड कर सकते हैं।',
  },
  te: {
    greeting: (name) => name ? `నమస్కారం, ${name}. నీరా కరెన్సీ సహాయకుడికి స్వాగతం.` : 'నీరా భారతీయ కరెన్సీ సహాయకుడికి స్వాగతం.',
    firstLaunchGreeting: () => 'నీరాకి స్వాగతం. కరెన్సీని స్కాన్ చేయడానికి స్క్రీన్‌పై నొక్కండి.',
    returningGreeting: () => 'నీరా స్కానర్ సిద్ధంగా ఉంది.',
    cameraReady: 'కెమెరా సిద్ధంగా ఉంది. స్కాన్ చేయడానికి స్క్రీన్‌పై నొక్కండి.',
    holdOverCurrency: 'నోటు లేదా నాణెం ముందు కెమెరా ఉంచి నొక్కండి.',
    currencyDetected: 'కరెన్సీ గుర్తించబడుతోంది.',
    identifyingCurrency: 'కరెన్సీ గుర్తింపు జరుగుతోంది.',
    successRecognition: (denom, confPct) => `ఇది ${denom}. మోడల్ ఖచ్చితత్వం ${confPct}.`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `ఇది ${denom}. విశ్వసనీయత ${confPct} శాతం.`,
    denominationAnnouncement: (spokenDenom) => `ఇది ${spokenDenom}.`,
    naturalAnnouncement: (spokenDenom) => `ఇది ${spokenDenom}.`,
    nonCurrencyRejection: 'కరెన్సీ గుర్తించబడలేదు.',
    rejectedGuidance:
      'నేను కరెన్సీ నోటు లేదా నాణేన్ని గుర్తించలేకపోయాను. దయచేసి కరెన్సీని స్పష్టంగా ఉంచి, మళ్లీ స్కాన్ చేయడానికి స్క్రీన్‌పై నొక్కండి.',
    rejectedUiTitle: 'గుర్తించబడలేదు.',
    rejectedUiNotice: 'దయచేసి కరెన్సీని స్పష్టంగా చూపించి, మళ్లీ ప్రయత్నించడానికి స్క్రీన్ పై ఎక్కడైనా నొక్కండి.',
    languageSelectedConfirm:
      'మీరు సహాయక భాషగా తెలుగును ఎంచుకున్నారు. భారతీయ కరెన్సీ నోటు లేదా నాణేన్ని స్కాన్ చేయడానికి స్క్రీన్‌పై నొక్కండి.',
    statusActive: 'ఈ కరెన్సీ చెల్లుబాటులో ఉంది.',
    statusWithdrawn2000: 'గమనిక: ₹2000 నోటు ఆర్బీఐ ద్వారా ఉపసంహరించబడింది.',
    statusWithdrawn25p: 'గమనిక: 25 పైసల నాణెం చెల్లదు.',
    statusLimited50p: '50 పైసల నాణెం పది రూపాయల వరకు మాత్రమే చెల్లుబాటు అవుతుంది.',
    readyForNext: 'తదుపరి కరెన్సీ కోసం సిద్ధంగా ఉంది.',
    uncertainRecognition:
      'నేను కరెన్సీ నోటు లేదా నాణేన్ని గుర్తించలేకపోయాను. దయచేసి కరెన్సీని స్పష్టంగా ఉంచి, మళ్లీ స్కాన్ చేయడానికి స్క్రీన్‌పై నొక్కండి.',
    serverOffline: 'సర్వర్ అందుబాటులో లేదు. కనెక్షన్‌ని తనిఖీ చేయండి.',
    serverConnected: 'నీరా సర్వర్ కనెక్ట్ అయింది. స్కానర్ సిద్ధంగా ఉంది.',
    tapToScan: 'కరెన్సీని స్కాన్ చేయడానికి స్క్రీన్‌పై ఎక్కడైనా నొక్కండి.',
    voiceUnavailableNotice: 'ఈ పరికరంలో తెలుగు వాయిస్ అందుబాటులో లేదు.',
    cameraPermissionNeeded: 'కరెన్సీని గుర్తించడానికి కెమెరా అనుమతి అవసరం.',
    cameraPermissionDenied: 'కెమెరా అనుమతి నిరాకరించబడింది.',
  },
  kn: {
    greeting: (name) => name ? `ನಮಸ್ಕಾರ, ${name}. ನೀರಾ ಕರೆನ್ಸಿ ಸಹಾಯಕಕ್ಕೆ ಸ್ವಾಗತ.` : 'ನೀರಾ ಕರೆನ್ಸಿ ಸಹಾಯಕಕ್ಕೆ ಸ್ವಾಗತ.',
    firstLaunchGreeting: () => 'ನೀರಾ ಕರೆನ್ಸಿ ಸಹಾಯಕಕ್ಕೆ ಸ್ವಾಗತ. ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಪರದೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ.',
    returningGreeting: () => 'ನೀರಾ ಸ್ಕ್ಯಾನರ್ ಸಿದ್ಧವಾಗಿದೆ.',
    cameraReady: 'ಕ್ಯಾಮೆರಾ ಸಿದ್ಧವಾಗಿದೆ. ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಪರದೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ.',
    holdOverCurrency: 'ನೋಟು ಅಥವಾ ನಾಣ್ಯದ ಮೇಲೆ ಕ್ಯಾಮೆರಾ ಹಿಡಿದು ಟ್ಯಾಪ್ ಮಾಡಿ.',
    currencyDetected: 'ಕರೆನ್ಸಿ ಪತ್ತೆಯಾಗಿದೆ. ಗುರುತಿಸಲಾಗುತ್ತಿದೆ.',
    identifyingCurrency: 'ಕರೆನ್ಸಿ ಗುರುತಿಸಲಾಗುತ್ತಿದೆ.',
    successRecognition: (denom, confPct) => `ಇದು ${denom}. ನಿಖರತೆ ${confPct}.`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `ಇದು ${denom}. ವಿಶ್ವಾಸಾರ್ಹತೆ ${confPct} ಪ್ರತಿಶತ.`,
    denominationAnnouncement: (spokenDenom) => `ಇದು ${spokenDenom}.`,
    naturalAnnouncement: (spokenDenom) => `ಇದು ${spokenDenom}.`,
    nonCurrencyRejection: 'ಕರೆನ್ಸಿ ಗುರುತಿಸಲಾಗಿಲ್ಲ.',
    rejectedGuidance:
      'ನನಗೆ ಕರೆನ್ಸಿ ನೋಟು ಅಥವಾ ನಾಣ್ಯವನ್ನು ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಕರೆನ್ಸಿಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಇರಿಸಿ, ಮತ್ತೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಪರದೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ.',
    rejectedUiTitle: 'ಗುರುತಿಸಲಾಗಿಲ್ಲ.',
    rejectedUiNotice: 'ದಯವಿಟ್ಟು ಕರೆನ್ಸಿಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ತೋರಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಲು ಸ್ಕ್ಯಾನ್ ಪ್ರದೇಶದಲ್ಲಿ ಎಲ್ಲಿಯಾದರೂ ಟ್ಯಾಪ್ ಮಾಡಿ.',
    languageSelectedConfirm:
      'ನೀವು ಸಹಾಯಕ ಭಾಷೆಯಾಗಿ ಕನ್ನಡವನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ಭಾರತೀಯ ಕರೆನ್ಸಿ ನೋಟು ಅಥವಾ ನಾಣ್ಯವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಪರದೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ.',
    statusActive: 'ಈ ಕರೆನ್ಸಿ ಚಲಾವಣೆಯಲ್ಲಿದೆ.',
    statusWithdrawn2000: 'ಸೂಚನೆ: ₹2000 ನೋಟು ಹಿಂಪಡೆಯಲಾಗಿದೆ.',
    statusWithdrawn25p: 'ಸೂಚನೆ: 25 ಪೈಸೆ ನಾಣ್ಯ ಅಮಾನ್ಯವಾಗಿದೆ.',
    statusLimited50p: '50 ಪೈಸೆ ನಾಣ್ಯ ಹತ್ತು ರೂಪಾಯಿವರೆಗೆ ಮಾತ್ರ ಮಾನ್ಯ.',
    readyForNext: 'ಮುಂದಿನ ಕರೆನ್ಸಿಗೆ ಸಿದ್ಧವಾಗಿದೆ.',
    uncertainRecognition:
      'ನನಗೆ ಕರೆನ್ಸಿ ನೋಟು ಅಥವಾ ನಾಣ್ಯವನ್ನು ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಕರೆನ್ಸಿಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಇರಿಸಿ, ಮತ್ತೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಪರದೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ.',
    serverOffline: 'ಸರ್ವರ್ ಸಂಪರ್ಕ ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ.',
    serverConnected: 'ನೀರಾ ಸರ್ವರ್ ಸಂಪರ್ಕಗೊಂಡಿದೆ. ಸ್ಕ್ಯಾನರ್ ಸಿದ್ಧ.',
    tapToScan: 'ಕರೆನ್ಸಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಲು ಪರದೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ.',
    voiceUnavailableNotice: 'ಈ ಸಾಧನದಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ.',
    cameraPermissionNeeded: 'ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ.',
    cameraPermissionDenied: 'ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ.',
  },
  ml: {
    greeting: (name) => name ? `നമസ്കാരം, ${name}. നീര കറൻസി അസിസ്റ്റന്റിലേക്ക് സ്വാഗതം.` : 'നീര കറൻസി അസിസ്റ്റന്റിലേക്ക് സ്വാഗതം.',
    firstLaunchGreeting: () => 'നീരയിലേക്ക് സ്വാഗതം. സ്കാൻ ചെയ്യാൻ സ്ക്രീനിൽ തൊടുക.',
    returningGreeting: () => 'നീര സ്കാനർ തയ്യാറാണ്.',
    cameraReady: 'ക്യാമറ തയ്യാറാണ്. സ്കാൻ ചെയ്യാൻ സ്ക്രീനിൽ തൊടുക.',
    holdOverCurrency: 'നോട്ടിന് അല്ലെങ്കിൽ നാണയത്തിന് നേരെ കാണിച്ച് സ്ക്രീനിൽ തൊടുക.',
    currencyDetected: 'കറൻസി കണ്ടെത്തി. തിരിച്ചറിയുന്നു.',
    identifyingCurrency: 'കറൻസി തിരിച്ചറിയുന്നു.',
    successRecognition: (denom, confPct) => `ഇത് ${denom}. കൃത്യത ${confPct}.`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `ഇത് ${denom}. വിശ്വാസ്യത ${confPct} ശതമാനം.`,
    denominationAnnouncement: (spokenDenom) => `ഇത് ${spokenDenom}.`,
    naturalAnnouncement: (spokenDenom) => `ഇത് ${spokenDenom}.`,
    nonCurrencyRejection: 'കറൻസി തിരിച്ചറിയാനായില്ല.',
    rejectedGuidance:
      'കറൻസി നോട്ടോ നാണയമോ തിരിച്ചറിയാൻ കഴിഞ്ഞില്ല. ദയവായി കറൻസി വ്യക്തമായി കാണിച്ച് വീണ്ടും സ്കാൻ ചെയ്യാൻ സ്ക്രീനിൽ തൊടുക.',
    rejectedUiTitle: 'തിരിച്ചറിയാനായില്ല.',
    rejectedUiNotice: 'ദയവായി കറൻസി വ്യക്തമായി കാണിച്ച് വീണ്ടും ശ്രമിക്കാൻ സ്ക്രീനിൽ തൊടുക.',
    languageSelectedConfirm:
      'നിങ്ങൾ സഹായ ഭാഷയായി മലയാളം തിരഞ്ഞെടുത്തു. ഇന്ത്യൻ കറൻസി നോട്ടോ നാണയമോ സ്കാൻ ചെയ്യാൻ സ്ക്രീനിൽ തൊടുക.',
    statusActive: 'ഈ കറൻസി പ്രാബല്യത്തിലുള്ളതാണ്.',
    statusWithdrawn2000: 'അറിയിപ്പ്: ₹2000 നോട്ട് പിൻവലിച്ചു.',
    statusWithdrawn25p: 'അറിയിപ്പ്: 25 പൈസ നാണയം അസാധുവാണ്.',
    statusLimited50p: '50 പൈസ നാണയം പത്ത് രൂപ വരെ മാത്രമേ സാധുവാകൂ.',
    readyForNext: 'അടുത്ത കറൻസിക്കായി തയ്യാറാണ്.',
    uncertainRecognition:
      'കറൻസി നോട്ടോ നാണയമോ തിരിച്ചറിയാൻ കഴിഞ്ഞില്ല. ദയവായി കറൻസി വ്യക്തമായി കാണിച്ച് വീണ്ടും സ്കാൻ ചെയ്യാൻ സ്ക്രീനിൽ തൊടുക.',
    serverOffline: 'സെർവർ ബന്ധം നഷ്ടപ്പെട്ടു.',
    serverConnected: 'നീര സെർവർ കണക്റ്റായി. സ്കാനർ തയ്യാറാണ്.',
    tapToScan: 'കറൻസി സ്കാൻ ചെയ്യാൻ സ്ക്രീനിൽ തൊടുക.',
    voiceUnavailableNotice: 'ഈ ഉപകരണത്തിൽ മലയാളം ശബ്ദം ലഭ്യമല്ല.',
    cameraPermissionNeeded: 'ക്യാമറ അനുമതി ആവശ്യമാണ്.',
    cameraPermissionDenied: 'ക്യാമറ അനുമതി നിരസിച്ചു.',
  },
  bn: {
    greeting: (name) => name ? `নমস্কার, ${name}। নীরা কারেন্সি অ্যাসিস্ট্যান্টে স্বাগতম।` : 'নীরা কারেন্সি অ্যাসিস্ট্যান্টে স্বাগতম।',
    firstLaunchGreeting: () => 'নীরায় স্বাগতম। স্ক্যান করতে স্ক্রিনে ট্যাপ করুন।',
    returningGreeting: () => 'নীরা স্ক্যানার প্রস্তুত।',
    cameraReady: 'ক্যামেরা প্রস্তুত। স্ক্যান করতে স্ক্রিনে ট্যাপ করুন।',
    holdOverCurrency: 'নোট বা মুদ্রার সামনে ক্যামেরা রাখুন এবং ট্যাপ করুন।',
    currencyDetected: 'মুদ্রা শনাক্ত করা হচ্ছে।',
    identifyingCurrency: 'মুদ্রা শনাক্তকরণ চলছে।',
    successRecognition: (denom, confPct) => `এটি ${denom}। নির্ভুলতা ${confPct}।`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `এটি ${denom}। আত্মবিশ্বাস ${confPct} শতাংশ।`,
    denominationAnnouncement: (spokenDenom) => `এটি ${spokenDenom}।`,
    naturalAnnouncement: (spokenDenom) => `এটি ${spokenDenom}।`,
    nonCurrencyRejection: 'মুদ্রা শনাক্ত করা যায়নি।',
    rejectedGuidance:
      'আমি কোনও মুদ্রা নোট বা কয়েন শনাক্ত করতে পারিনি। অনুগ্রহ করে মুদ্রাটি স্পষ্টভাবে সামনে রাখুন এবং আবার স্ক্যান করতে স্ক্রিনে ট্যাপ করুন।',
    rejectedUiTitle: 'শনাক্ত করা যায়নি।',
    rejectedUiNotice: 'অনুগ্রহ করে মুদ্রাটি স্পষ্টভাবে দেখান এবং আবার চেষ্টা করতে স্ক্রিনে ট্যাপ করুন।',
    languageSelectedConfirm:
      'আপনি সহকারী ভাষা হিসেবে বাংলা নির্বাচন করেছেন। ভারতীয় মুদ্রা নোট বা কয়েন স্ক্যান করতে স্ক্রিনে ট্যাপ করুন।',
    statusActive: 'এই মুদ্রাটি বৈধ এবং প্রচলনে রয়েছে।',
    statusWithdrawn2000: 'বিজ্ঞপ্তি: ₹২০০০ নোট প্রত্যাহার করা হয়েছে।',
    statusWithdrawn25p: 'বিজ্ঞপ্তি: ২৫ পয়সা মুদ্রা বাতিল হয়েছে।',
    statusLimited50p: '৫০ পয়সা মুদ্রা দশ টাকা পর্যন্ত বৈধ।',
    readyForNext: 'পরবর্তী মুদ্রার জন্য প্রস্তুত।',
    uncertainRecognition:
      'আমি কোনও মুদ্রা নোট বা কয়েন শনাক্ত করতে পারিনি। অনুগ্রহ করে মুদ্রাটি স্পষ্টভাবে সামনে রাখুন এবং আবার স্ক্যান করতে স্ক্রিনে ট্যাপ করুন।',
    serverOffline: 'সার্ভার সংযোগ পাওয়া যাচ্ছে না।',
    serverConnected: 'নীরা সার্ভার সংযুক্ত। স্ক্যানার প্রস্তুত।',
    tapToScan: 'মুদ্রা স্ক্যান করতে স্ক্রিনের যেকোনো জায়গায় ট্যাপ করুন।',
    voiceUnavailableNotice: 'এই ডিভাইসে বাংলা ভয়েস উপলব্ধ নেই।',
    cameraPermissionNeeded: 'ক্যামেরা অনুমতি প্রয়োজন।',
    cameraPermissionDenied: 'ক্যামেরা অনুমতি প্রত্যাখ্যান করা হয়েছে।',
  },
  mr: {
    greeting: (name) => name ? `नमस्कार, ${name}. नीरा चलन सहाय्यकामध्ये स्वागत आहे.` : 'नीरा चलन सहाय्यकामध्ये स्वागत आहे.',
    firstLaunchGreeting: () => 'नीरामध्ये स्वागत आहे. स्कॅन करण्यासाठी स्क्रीनवर टॅप करा.',
    returningGreeting: () => 'नीरा स्कॅनर तयार आहे.',
    cameraReady: 'कॅमेरा तयार आहे. स्कॅन करण्यासाठी स्क्रीनवर टॅप करा.',
    holdOverCurrency: 'नोट किंवा नाण्याच्या समोर कॅमेरा धरा आणि टॅप करा.',
    currencyDetected: 'चलन ओळखले जात आहे.',
    identifyingCurrency: 'चलनाची ओळख सुरू आहे.',
    successRecognition: (denom, confPct) => `हे ${denom} आहे. अचूकता ${confPct}.`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `हे ${denom} आहे. विश्वास स्तर ${confPct} टक्के.`,
    denominationAnnouncement: (spokenDenom) => `हे ${spokenDenom} आहे.`,
    naturalAnnouncement: (spokenDenom) => `हे ${spokenDenom} आहे.`,
    nonCurrencyRejection: 'चलन ओळखू शकलो नाही.',
    rejectedGuidance:
      'मी चलन नोट किंवा नाणे ओळखू शकलो नाही. कृपया चलन स्पष्टपणे दाखवा आणि पुन्हा स्कॅन करण्यासाठी स्क्रीनवर टॅप करा.',
    rejectedUiTitle: 'ओळखले नाही.',
    rejectedUiNotice: 'कृपया चलन स्पष्टपणे दाखवा आणि पुन्हा प्रयत्न करण्यासाठी स्क्रीनवर कुठेही टॅप करा.',
    languageSelectedConfirm:
      'तुम्ही सहाय्यक भाषा म्हणून मराठी निवडली आहे. भारतीय चलन नोट किंवा नाणे स्कॅन करण्यासाठी स्क्रीनवर टॅप करा.',
    statusActive: 'हे चलन व्यवहारात पूर्णपणे वैध आहे.',
    statusWithdrawn2000: 'सूचना: ₹२००० ची नोट चलनातून मागे घेतली आहे.',
    statusWithdrawn25p: 'सूचना: २५ पैशांचे नाणे रद्द झाले आहे.',
    statusLimited50p: '५० पैशांचे नाणे दहा रुपयांपर्यंतच्या देयकासाठी वैध आहे.',
    readyForNext: 'पुढील चलनासाठी तयार.',
    uncertainRecognition:
      'मी चलन नोट किंवा नाणे ओळखू शकलो नाही. कृपया चलन स्पष्टपणे दाखवा आणि पुन्हा स्कॅन करण्यासाठी स्क्रीनवर टॅप करा.',
    serverOffline: 'सर्व्हरशी संपर्क होत नाही.',
    serverConnected: 'नीरा सर्व्हर कनेक्ट झाले. स्कॅनर तयार आहे.',
    tapToScan: 'चलन स्कॅन करण्यासाठी स्क्रीनवर कुठेही टॅप करा.',
    voiceUnavailableNotice: 'या डिव्हाइसवर मराठी आवाज उपलब्ध नाही.',
    cameraPermissionNeeded: 'कॅमेरा परवानगी आवश्यक आहे.',
    cameraPermissionDenied: 'कॅमेरा परवानगी नाकारली गेली.',
  },
  gu: {
    greeting: (name) => name ? `નમસ્તે, ${name}. નીરા કરન્સી સહાયકમાં આપનું સ્વાગત છે.` : 'નીરા કરન્સી સહાયકમાં આપનું સ્વાગત છે.',
    firstLaunchGreeting: () => 'નીરામાં આપનું સ્વાગત છે. સ્કેન કરવા માટે સ્ક્રીન પર ટેપ કરો.',
    returningGreeting: () => 'નીરા સ્કેનર તૈયાર છે.',
    cameraReady: 'કૅમેરો તૈયાર છે. સ્કેન કરવા માટે સ્ક્રીન પર ટેપ કરો.',
    holdOverCurrency: 'ચલણ સામે કૅમેરો રાખો અને ટેપ કરો.',
    currencyDetected: 'ચલણ ઓળખાઈ રહ્યું છે.',
    identifyingCurrency: 'ચલણની ઓળખ ચાલુ છે.',
    successRecognition: (denom, confPct) => `આ ${denom} છે. ચોકસાઈ ${confPct}.`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `આ ${denom} છે. વિશ્વાસ સ્તર ${confPct} ટકા.`,
    denominationAnnouncement: (spokenDenom) => `આ ${spokenDenom} છે.`,
    naturalAnnouncement: (spokenDenom) => `આ ${spokenDenom} છે.`,
    nonCurrencyRejection: 'ચલણ ઓળખી શકાયું નથી.',
    rejectedGuidance:
      'હું ચલણી નોટ અથવા સિક્કો ઓળખી શક્યો નથી. કૃપા કરીને ચલણને સ્પષ્ટપણે બતાવો અને ફરીથી સ્કેન કરવા માટે સ્ક્રીન પર ટેપ કરો.',
    rejectedUiTitle: 'ઓળખાયું નથી.',
    rejectedUiNotice: 'કૃપા કરીને ચલણ સ્પષ્ટપણે બતાવો અને ફરીથી પ્રયાસ કરવા માટે સ્ક્રીન પર ગમે ત્યાં ટેપ કરો.',
    languageSelectedConfirm:
      'તમે સહાયક ભાષા તરીકે ગુજરાતી પસંદ કરી છે. ભારતીય ચલણી નોટ અથવા સિક્કો સ્કેન કરવા માટે સ્ક્રીન પર ટેપ કરો.',
    statusActive: 'આ ચલણ વ્યવહારમાં માન્ય છે.',
    statusWithdrawn2000: 'સૂચના: ₹૨૦૦૦ ની નોટ ચલણમાંથી પાછી ખેંચાઈ છે.',
    statusWithdrawn25p: 'સૂચના: ૨૫ પૈસાનો સિક્કો અમાન્ય થયો છે.',
    statusLimited50p: '૫૦ પૈસાનો સિક્કો દસ રૂપિયા સુધી માન્ય છે.',
    readyForNext: 'આગલા ચલણ માટે તૈયાર.',
    uncertainRecognition:
      'હું ચલણી નોટ અથવા સિક્કો ઓળખી શક્યો નથી. કૃપા કરીને ચલણને સ્પષ્ટપણે બતાવો અને ફરીથી સ્કેન કરવા માટે સ્ક્રીન પર ટેપ કરો.',
    serverOffline: 'સર્વર સાથે સંપર્ક થતો નથી.',
    serverConnected: 'નીરા સર્વર કનેક્ટ થઈ ગયું છે. સ્કેનર તૈયાર છે.',
    tapToScan: 'ચલણ સ્કેન કરવા માટે સ્ક્રીન પર ગમે ત્યાં ટેપ કરો.',
    voiceUnavailableNotice: 'આ ડિવાઇસ પર ગુજરાતી અવાજ ઉપલબ્ધ નથી.',
    cameraPermissionNeeded: 'કૅમેરા પરવાનગી જરૂરી છે.',
    cameraPermissionDenied: 'કૅમેરા પરવાનગી નકારી કાઢવામાં આવી.',
  },
  pa: {
    greeting: (name) => name ? `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ${name}। ਨੀਰਾ ਕਰੰਸੀ ਸਹਾਇਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।` : 'ਨੀਰਾ ਕਰੰਸੀ ਸਹਾਇਕ ਵਿੱਚ ਸੁਆਗਤ ਹੈ।',
    firstLaunchGreeting: () => 'ਨੀਰਾ ਵਿੱਚ ਸੁਆਗਤ ਹੈ। ਸਕੈਨ ਕਰਨ ਲਈ ਸਕ੍ਰੀਨ ਤੇ ਟੈਪ ਕਰੋ।',
    returningGreeting: () => 'ਨੀਰਾ ਸਕੈਨਰ ਤਿਆਰ ਹੈ।',
    cameraReady: 'ਕੈਮਰਾ ਤਿਆਰ ਹੈ। ਸਕੈਨ ਕਰਨ ਲਈ ਸਕ੍ਰੀਨ ਤੇ ਟੈਪ ਕਰੋ।',
    holdOverCurrency: 'ਕਰੰਸੀ ਸਾਹਮਣੇ ਕੈਮਰਾ ਰੱਖੋ ਅਤੇ ਟੈਪ ਕਰੋ।',
    currencyDetected: 'ਕਰੰਸੀ ਦੀ ਪਛਾਣ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ।',
    identifyingCurrency: 'ਪਛਾਣ ਜਾਰੀ ਹੈ।',
    successRecognition: (denom, confPct) => `ਇਹ ${denom} ਹੈ। ਸ਼ੁੱਧਤਾ ${confPct}।`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `ਇਹ ${denom} ਹੈ। ਵਿਸ਼ਵਾਸ ਪੱਧਰ ${confPct} ਪ੍ਰਤੀਸ਼ਤ.`,
    denominationAnnouncement: (spokenDenom) => `ਇਹ ${spokenDenom} ਹੈ।`,
    naturalAnnouncement: (spokenDenom) => `ਇਹ ${spokenDenom} ਹੈ।`,
    nonCurrencyRejection: 'ਕਰੰਸੀ ਦੀ ਪਛਾਣ ਨਹੀਂ ਹੋ ਸਕੀ।',
    rejectedGuidance:
      'ਮੈਂ ਕਰੰਸੀ ਨੋਟ ਜਾਂ ਸਿੱਕੇ ਦੀ ਪਛਾਣ ਨਹੀਂ ਕਰ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਕਰੰਸੀ ਨੂੰ ਸਾਫ਼ ਤੌਰ ਤੇ ਦਿਖਾਓ ਅਤੇ ਦੁਬਾਰਾ ਸਕੈਨ ਕਰਨ ਲਈ ਸਕ੍ਰੀਨ ਤੇ ਟੈਪ ਕਰੋ।',
    rejectedUiTitle: 'ਕੋਈ ਪਛਾਣ ਨਹੀਂ ਹੋਈ।',
    rejectedUiNotice: 'ਕਿਰਪਾ ਕਰਕੇ ਕਰੰਸੀ ਸਾਫ਼ ਦਿਖਾਓ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰਨ ਲਈ ਸਕ੍ਰੀਨ ਤੇ ਟੈਪ ਕਰੋ।',
    languageSelectedConfirm:
      'ਤੁਸੀਂ ਸਹਾਇਕ ਭਾਸ਼ਾ ਵਜੋਂ ਪੰਜਾਬੀ ਚੁਣੀ ਹੈ। ਭਾਰਤੀ ਕਰੰਸੀ ਨੋਟ ਜਾਂ ਸਿੱਕੇ ਨੂੰ ਸਕੈਨ ਕਰਨ ਲਈ ਸਕ੍ਰੀਨ ਤੇ ਟੈਪ ਕਰੋ।',
    statusActive: 'ਇਹ ਕਰੰਸੀ ਚੱਲਣ ਵਿੱਚ ਜਾਇਜ਼ ਹੈ।',
    statusWithdrawn2000: 'ਸੂਚਨਾ: ₹2000 ਦਾ ਨੋਟ ਵਾਪਸ ਲਿਆ ਗਿਆ ਹੈ।',
    statusWithdrawn25p: 'ਸੂਚਨਾ: 25 ਪੈਸੇ ਦਾ ਸਿੱਕਾ ਬੰਦ ਹੋ ਚੁੱਕਾ ਹੈ।',
    statusLimited50p: '50 ਪੈਸੇ ਦਾ ਸਿੱਕਾ ਦਸ ਰੁਪਏ ਤੱਕ ਵੈਧ ਹੈ।',
    readyForNext: 'ਅਗਲੀ ਕਰੰਸੀ ਲਈ ਤਿਆਰ।',
    uncertainRecognition:
      'ਮੈਂ ਕਰੰਸੀ ਨੋਟ ਜਾਂ ਸਿੱਕੇ ਦੀ ਪਛਾਣ ਨਹੀਂ ਕਰ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਕਰੰਸੀ ਨੂੰ ਸਾਫ਼ ਤੌਰ ਤੇ ਦਿਖਾਓ ਅਤੇ ਦੁਬਾਰਾ ਸਕੈਨ ਕਰਨ ਲਈ ਸਕ੍ਰੀਨ ਤੇ ਟੈਪ ਕਰੋ।',
    serverOffline: 'ਸਰਵਰ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਰਿਹਾ।',
    serverConnected: 'ਨੀਰਾ ਸਰਵਰ ਕਨੈਕਟ ਹੋ ਗਿਆ। ਸਕੈਨਰ ਤਿਆਰ ਹੈ।',
    tapToScan: 'ਕਰੰਸੀ ਸਕੈਨ ਕਰਨ ਲਈ ਸਕ੍ਰੀਨ ਤੇ ਟੈਪ ਕਰੋ।',
    voiceUnavailableNotice: 'ਇਸ ਡਿਵਾਈਸ ਤੇ ਪੰਜਾਬੀ ਆਵਾਜ਼ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।',
    cameraPermissionNeeded: 'ਕੈਮਰਾ ਇਜਾਜ਼ਤ ਦੀ ਲੋੜ ਹੈ।',
    cameraPermissionDenied: 'ਕੈਮਰਾ ਇਜਾਜ਼ਤ ਰੱਦ ਕੀਤੀ ਗਈ।',
  },
  or: {
    greeting: (name) => name ? `ନମସ୍କାର, ${name}। ନୀରା ମୁଦ୍ରା ସହାୟକକୁ ସ୍ୱାଗତ।` : 'ନୀରା ମୁଦ୍ରା ସହାୟକକୁ ସ୍ୱାଗତ।',
    firstLaunchGreeting: () => 'ନୀରାକୁ ସ୍ୱାଗତ। ସ୍କାନ୍ କରିବା ପାଇଁ ସ୍କ୍ରିନରେ ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    returningGreeting: () => 'ନୀରା ସ୍କାନର୍ ପ୍ରସ୍ତୁତ।',
    cameraReady: 'କ୍ୟାମେରା ପ୍ରସ୍ତୁତ। ସ୍କାନ୍ କରିବା ପାଇଁ ସ୍କ୍ରିନରେ ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    holdOverCurrency: 'ମୁଦ୍ରା ଆଗରେ କ୍ୟାମେରା ରଖି ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    currencyDetected: 'ମୁଦ୍ରା ଚିହ୍ନଟ କରାଯାଉଛି।',
    identifyingCurrency: 'ମୁଦ୍ରା ଚିହ୍ନଟ ପ୍ରକ୍ରିୟା ଚାଲିଛି।',
    successRecognition: (denom, confPct) => `ଏହା ${denom}। ସଠିକତା ${confPct}।`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `ଏହା ${denom}। ଆତ୍ମବିଶ୍ୱାସ ସ୍ତର ${confPct} ପ୍ରତିଶତ।`,
    denominationAnnouncement: (spokenDenom) => `ଏହା ${spokenDenom}।`,
    naturalAnnouncement: (spokenDenom) => `ଏହା ${spokenDenom}।`,
    nonCurrencyRejection: 'ମୁଦ୍ରା ଚିହ୍ନଟ ହୋଇପାରିଲା ନାହିଁ।',
    rejectedGuidance:
      'ମୁଁ କୌଣସି ମୁଦ୍ରା ନୋଟ୍ କିମ୍ବା ମୁଦ୍ରା ଚିହ୍ନଟ କରିପାରିଲି ନାହିଁ। ଦୟାକରି ମୁଦ୍ରାକୁ ସ୍ପଷ୍ଟ ଭାବରେ ଦେଖାନ୍ତୁ ଏବଂ ପୁନର୍ବାର ସ୍କାନ୍ କରିବା ପାଇଁ ସ୍କ୍ରିନରେ ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    rejectedUiTitle: 'ଚିହ୍ନଟ ହୋଇପାରିଲା ନାହିଁ।',
    rejectedUiNotice: 'ଦୟାକରି ମୁଦ୍ରା ସ୍ପଷ୍ଟ ଭାବରେ ଦେଖାନ୍ତୁ ଏବଂ ପୁନଃ ଚେଷ୍ଟା ପାଇଁ ସ୍କ୍ରିନରେ ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    languageSelectedConfirm:
      'ଆପଣ ସହାୟକ ଭାଷା ଭାବରେ ଓଡ଼ିଆ ବାଛିଛନ୍ତି। ଭାରତୀୟ ମୁଦ୍ରା ନୋଟ୍ କିମ୍ବା ମୁଦ୍ରା ସ୍କାନ୍ କରିବା ପାଇଁ ସ୍କ୍ରିନରେ ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    statusActive: 'ଏହି ମୁଦ୍ରା ପ୍ରଚଳନରେ ବୈଧ ଅଟେ।',
    statusWithdrawn2000: 'ସୂଚନା: ₹୨୦୦୦ ନୋଟ୍ ପ୍ରତ୍ୟାହାର କରାଯାଇଛି।',
    statusWithdrawn25p: 'ସୂଚନା: ୨୫ ପଇସା ମୁଦ୍ରା ବନ୍ଦ ହୋଇଛି।',
    statusLimited50p: '୫୦ ପଇସା ମୁଦ୍ରା ଦଶ ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ବୈଧ।',
    readyForNext: 'ପରବର୍ତ୍ତୀ ମୁଦ୍ରା ପାଇଁ ପ୍ରସ୍ତୁତ।',
    uncertainRecognition:
      'ମୁଁ କୌଣସି ମୁଦ୍ରା ନୋଟ୍ କିମ୍ବା ମୁଦ୍ରା ଚିହ୍ନଟ କରିପାରିଲି ନାହିଁ। ଦୟାକରି ମୁଦ୍ରାକୁ ସ୍ପଷ୍ଟ ଭାବରେ ଦେଖାନ୍ତୁ ଏବଂ ପୁନର୍ବାର ସ୍କାନ୍ କରିବା ପାଇଁ ସ୍କ୍ରିନରେ ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    serverOffline: 'ସର୍ଭର ସଂଯୋଗ ହୋଇପାରୁନାହିଁ।',
    serverConnected: 'ନୀରା ସର୍ଭର ସଂଯୁକ୍ତ ହେଲା। ସ୍କାନର୍ ପ୍ରସ୍ତୁତ।',
    tapToScan: 'ମୁଦ୍ରା ସ୍କାନ୍ କରିବା ପାଇଁ ସ୍କ୍ରିନରେ ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    voiceUnavailableNotice: 'ଏହି ଡିଭାଇସରେ ଓଡ଼ିଆ ସ୍ୱର ଉପଲବ୍ଧ ନାହିଁ।',
    cameraPermissionNeeded: 'କ୍ୟାମେରା ଅନୁମତି ଆବଶ୍ୟକ।',
    cameraPermissionDenied: 'କ୍ୟାମେରା ଅନୁମତି ପ୍ରତ୍ୟାଖ୍ୟାନ କରାଗଲା।',
  },
  ur: {
    greeting: (name) => name ? `سلام، ${name}۔ نیرا کرنسی اسسٹنٹ میں خوش آمدید۔` : 'نیرا کرنسی اسسٹنٹ میں خوش آمدید۔',
    firstLaunchGreeting: () => 'نیرا میں خوش آمدید۔ اسکین کرنے کے لیے اسکرین پر ٹیپ کریں۔',
    returningGreeting: () => 'نیرا اسکینر تیار ہے۔',
    cameraReady: 'کیمرہ تیار ہے۔ اسکین کرنے کے لیے اسکرین پر ٹیپ کریں۔',
    holdOverCurrency: 'کیمرہ نوٹ یا سکے کے سامنے لائیں اور ٹیپ کریں۔',
    currencyDetected: 'کرنسی کی شناخت کی جا رہی ہے۔',
    identifyingCurrency: 'شناخت جاری ہے۔',
    successRecognition: (denom, confPct) => `یہ ${denom} ہے۔ درستگی ${confPct}۔`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `یہ ${denom} ہے۔ اعتماد ${confPct} فیصد.`,
    denominationAnnouncement: (spokenDenom) => `یہ ${spokenDenom} ہے۔`,
    naturalAnnouncement: (spokenDenom) => `یہ ${spokenDenom} ہے۔`,
    nonCurrencyRejection: 'کرنسی کی شناخت نہیں ہو سکی۔',
    rejectedGuidance:
      'میں کسی کرنسی نوٹ یا سکے کی شناخت نہیں کر سکا۔ براہ کرم کرنسی کو واضح طور پر سامنے رکھیں اور دوبارہ اسکین کرنے کے لیے اسکرین پر ٹیپ کریں۔',
    rejectedUiTitle: 'شناخت نہیں ہو سکی۔',
    rejectedUiNotice: 'براہ کرم کرنسی واضح طور پر دکھائیں اور دوبارہ کوشش کے لیے اسکرین پر ٹیپ کریں۔',
    languageSelectedConfirm:
      'آپ نے معاون زبان کے طور پر اردو کا انتخاب کیا ہے۔ ہندوستانی کرنسی نوٹ یا سکہ اسکین کرنے کے لیے اسکرین پر ٹیپ کریں۔',
    statusActive: 'یہ کرنسی گردش میں قانونی ہے۔',
    statusWithdrawn2000: 'اطلاع: ₹2000 کا نوٹ واپس لے لیا گیا ہے۔',
    statusWithdrawn25p: 'اطلاع: 25 پیسے کا سکہ منسوخ ہو چکا ہے۔',
    statusLimited50p: '50 پیسے کا سکہ دس روپے تک کے لیے قانونی ہے۔',
    readyForNext: 'اگلی کرنسی کے لیے تیار۔',
    uncertainRecognition:
      'میں کسی کرنسی نوٹ یا سکے کی شناخت نہیں کر سکا۔ براہ کرم کرنسی کو واضح طور پر سامنے رکھیں اور دوبارہ اسکین کرنے کے لیے اسکرین پر ٹیپ کریں۔',
    serverOffline: 'سرور سے رابطہ نہیں ہو رہا۔',
    serverConnected: 'نیرا سرور منسلک ہو گیا۔ اسکینر تیار ہے۔',
    tapToScan: 'کرنسی اسکین کرنے کے لیے اسکرین پر ٹیپ کریں۔',
    voiceUnavailableNotice: 'اس ڈیوائس پر اردو آواز دستیاب نہیں ہے۔',
    cameraPermissionNeeded: 'کیمرہ کی اجازت درکار ہے۔',
    cameraPermissionDenied: 'کیمرہ کی اجازت مسترد کر دی گئی۔',
  },
  as: {
    greeting: (name) => name ? `নমস্কাৰ, ${name}। নীৰা মুদ্ৰা সহায়কলৈ স্বাগতম।` : 'নীৰা মুদ্ৰা সহায়কলৈ স্বাগতম।',
    firstLaunchGreeting: () => 'নীৰালৈ স্বাগতম। স্কেন কৰিবলৈ স্ক্ৰীণত টেপ কৰক।',
    returningGreeting: () => 'নীৰা স্কেনাৰ সাজু হৈছে।',
    cameraReady: 'কেমেৰা সাজু হৈছে। স্কেন কৰিবলৈ স্ক্ৰীণত টেপ কৰক।',
    holdOverCurrency: 'নোট বা মুদ্ৰাৰ সন্মুখত কেমেৰা ৰাখক আৰু টেপ কৰক।',
    currencyDetected: 'মুদ্ৰা চিনাক্ত কৰা হৈছে।',
    identifyingCurrency: 'মুদ্ৰা চিনাক্তকৰণ চলি আছে।',
    successRecognition: (denom, confPct) => `এইটো ${denom}। সঠিকতা ${confPct}।`,
    successFullAnnouncement: (denom, _isCoin, confPct) =>
      `এইটো ${denom}। আত্মবিশ্বাস ${confPct} শতাংশ।`,
    denominationAnnouncement: (spokenDenom) => `এইটো ${spokenDenom}।`,
    naturalAnnouncement: (spokenDenom) => `এইটো ${spokenDenom}।`,
    nonCurrencyRejection: 'মুদ্ৰা চিনাক্ত কৰিব পৰা নগল।',
    rejectedGuidance:
      'মই কোনো মুদ্ৰা নোট বা মুদ্ৰা চিনাক্ত কৰিব নোৱাৰিলোঁ। অনুগ্ৰহ কৰি মুদ্ৰাটো স্পষ্টভাৱে দেখুৱাওক আৰু পুনৰ স্কেন কৰিবলৈ স্ক্ৰীণত টেপ কৰক।',
    rejectedUiTitle: 'চিনাক্ত নহ\'ল।',
    rejectedUiNotice: 'অনুগ্ৰহ কৰি মুদ্ৰা স্পষ্টভাৱে দেখুৱাওক আৰু পুনৰ চেষ্টা কৰিবলৈ স্ক্ৰীণত টেপ কৰক।',
    languageSelectedConfirm:
      'আপুনি সহায়ক ভাষা হিচাপে অসমীয়া বাছি লৈছে। ভাৰতীয় মুদ্ৰা নোট বা মুদ্ৰা স্কেন কৰিবলৈ স্ক্ৰীণত টেপ কৰক।',
    statusActive: 'এই মুদ্ৰাটো বৈধ আৰু প্ৰচলনত আছে।',
    statusWithdrawn2000: 'জাননী: ₹২০০০ নোট প্ৰত্যাহাৰ কৰা হৈছে।',
    statusWithdrawn25p: 'জাননী: ২৫ পইচা মুদ্ৰা বাতিল কৰা হৈছে।',
    statusLimited50p: '৫০ পইচা মুদ্ৰা দহ টকালৈকে বৈধ।',
    readyForNext: 'পৰৱৰ্তী মুদ্ৰাৰ বাবে সাজু।',
    uncertainRecognition:
      'মই কোনো মুদ্ৰা নোট বা মুদ্ৰা চিনাক্ত কৰিব নোৱাৰিলোঁ। অনুগ্ৰহ কৰি মুদ্ৰাটো স্পষ্টভাৱে দেখুৱাওক আৰু পুনৰ স্কেন কৰিবলৈ স্ক্ৰীণত টেপ কৰক।',
    serverOffline: 'চাৰ্ভাৰ সংযোগ পোৱা নাই।',
    serverConnected: 'নীৰা চাৰ্ভাৰ সংযোজিত হ\'ল। স্কেনাৰ সাজু।',
    tapToScan: 'মুদ্ৰা স্কেন কৰিবলৈ স্ক্ৰীণত টেপ কৰক।',
    voiceUnavailableNotice: 'এই ডিভাইচত অসমীয়া কণ্ঠ উপলব্ধ নহয়।',
    cameraPermissionNeeded: 'কেমেৰাৰ অনুমতি প্ৰয়োজন।',
    cameraPermissionDenied: 'কেমেৰাৰ অনুমতি নাকচ কৰা হৈছে।',
  },
};

// Fallback helper to get phrase for any supported language
export function getPhrases(lang: string): WorkflowPhrases {
  return WORKFLOW_PHRASES[lang] || WORKFLOW_PHRASES['en'];
}

export function getSpokenDenomination(denom: string, lang: string): string {
  const map = SPOKEN_DENOMINATIONS[denom];
  if (!map) return denom;
  return map[lang] || map['en'] || denom;
}

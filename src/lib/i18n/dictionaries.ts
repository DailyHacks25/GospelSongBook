/**
 * UI dictionaries. Every interface label exists in both languages —
 * English (en) and Hindi (hi).
 */

export interface Dictionary {
  meta: {
    title: string;
    tagline: string;
    description: string;
  };
  nav: {
    home: string;
    songs: string;
    submit: string;
    mySongs: string;
    admin: string;
    signIn: string;
    signOut: string;
    language: string;
    switchLanguage: string;
  };
  landing: {
    heading: string;
    subheading: string;
    chooseLanguage: string;
    english: string;
    hindi: string;
    enterEnglish: string;
    enterHindi: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    browseByCategory: string;
    categoriesSubtitle: string;
    recentSongs: string;
    recentSubtitle: string;
    searchPlaceholder: string;
    search: string;
    viewAllSongs: string;
    submitSong: string;
    howItWorks: string;
    stepSignIn: string;
    stepSignInDesc: string;
    stepSubmit: string;
    stepSubmitDesc: string;
    stepReview: string;
    stepReviewDesc: string;
  };
  songs: {
    title: string;
    subtitle: string;
    allCategories: string;
    allLanguages: string;
    english: string;
    hindi: string;
    searchLabel: string;
    searchPlaceholder: string;
    results: string;
    noResults: string;
    noResultsHint: string;
    clearFilters: string;
    loadMore: string;
    readLyrics: string;
    pending: string;
    approved: string;
    rejected: string;
    submittedBy: string;
    category: string;
    language: string;
    lyrics: string;
    backToSongs: string;
    backgroundCredit: string;
    backgroundFallback: string;
    edit: string;
    delete: string;
    resubmit: string;
  };
  submit: {
    title: string;
    subtitle: string;
    signInRequired: string;
    signInRequiredDesc: string;
    fieldTitle: string;
    fieldTitleHint: string;
    fieldLanguage: string;
    fieldCategory: string;
    fieldLyrics: string;
    fieldLyricsHint: string;
    chooseCategory: string;
    chooseLanguage: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successDescription: string;
    save: string;
    saveChanges: string;
    cancel: string;
    editTitle: string;
    editSubtitle: string;
    charCount: string;
  };
  mySongs: {
    title: string;
    subtitle: string;
    empty: string;
    emptyHint: string;
    status: string;
    updatedAt: string;
    actions: string;
    view: string;
  };
  admin: {
    title: string;
    subtitle: string;
    dashboard: string;
    pendingReview: string;
    pendingReviewDesc: string;
    totalSongs: string;
    approvedSongs: string;
    pendingSongs: string;
    rejectedSongs: string;
    approve: string;
    reject: string;
    approveConfirmTitle: string;
    approveConfirmDescription: string;
    rejectConfirmTitle: string;
    rejectConfirmDescription: string;
    reviewNote: string;
    reviewNoteOptional: string;
    confirm: string;
    cancel: string;
    noPending: string;
    noPendingDesc: string;
    manageCategories: string;
    manageCategoriesDesc: string;
    categoriesTitle: string;
    categoriesSubtitle: string;
    categorySlug: string;
    categoryNameEn: string;
    categoryNameHi: string;
    categorySortOrder: string;
    addCategory: string;
    updateCategory: string;
    deleteCategory: string;
    deleteCategoryConfirm: string;
    deleteCategoryBlocked: string;
    editSong: string;
    deleteSong: string;
    deleteSongConfirm: string;
    deleteSongConfirmDesc: string;
    accessDenied: string;
    accessDeniedDesc: string;
    allSongs: string;
  };
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    signInAction: string;
    signingIn: string;
    email: string;
    password: string;
    invalidCredentials: string;
    signOutConfirm: string;
    signedInAs: string;
    securityNote: string;
  };
  errors: {
    generic: string;
    network: string;
    unauthorized: string;
    forbidden: string;
    notFound: string;
    validation: string;
    conflict: string;
    tryAgain: string;
  };
  status: {
    pending: string;
    approved: string;
    rejected: string;
    pendingHint: string;
    approvedHint: string;
    rejectedHint: string;
  };
  footer: {
    builtWith: string;
    rights: string;
    unsplashNote: string;
  };
  common: {
    loading: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    page: string;
    of: string;
    unnamed: string;
    required: string;
    optional: string;
  };
}

const en: Dictionary = {
  meta: {
    title: "WorshipJesusChrist — Gospel Song Book",
    tagline: "A bilingual Gospel song book",
    description:
      "A calm, bilingual (English and Hindi) Gospel song book with worship, prayer, Easter, Good Friday, Palm Sunday and Christmas songs.",
  },
  nav: {
    home: "Home",
    songs: "Song Book",
    submit: "Submit a Song",
    mySongs: "My Songs",
    admin: "Admin",
    signIn: "Sign in",
    signOut: "Sign out",
    language: "Language",
    switchLanguage: "Switch language",
  },
  landing: {
    heading: "WorshipJesusChrist",
    subheading: "A bilingual Gospel song book — English & हिंदी",
    chooseLanguage: "Choose your language / अपनी भाषा चुनें",
    english: "English",
    hindi: "हिंदी",
    enterEnglish: "Continue in English",
    enterHindi: "हिंदी में जारी रखें",
  },
  home: {
    heroTitle: "Sing the Gospel, in English and Hindi",
    heroSubtitle:
      "Browse worship, prayer and seasonal songs. Read the lyrics, search the book, and share the songs God has laid on your heart.",
    browseByCategory: "Browse by category",
    categoriesSubtitle: "Every category is available in English and Hindi.",
    recentSongs: "Recently added songs",
    recentSubtitle: "Songs approved by our editors, newest first.",
    searchPlaceholder: "Search songs or lyrics…",
    search: "Search",
    viewAllSongs: "View the full song book",
    submitSong: "Submit a song",
    howItWorks: "How it works",
    stepSignIn: "Sign in to your account",
    stepSignInDesc: "Use the email and password issued by the site administrator.",
    stepSubmit: "Submit your song",
    stepSubmitDesc: "Add a title, language, category and lyrics. Submissions start as pending.",
    stepReview: "Editor review",
    stepReviewDesc: "An admin approves the song and it appears in the song book immediately.",
  },
  songs: {
    title: "Song Book",
    subtitle: "Browse and search approved Gospel songs.",
    allCategories: "All categories",
    allLanguages: "All languages",
    english: "English",
    hindi: "Hindi",
    searchLabel: "Search",
    searchPlaceholder: "Search titles or lyrics…",
    results: "songs",
    noResults: "No songs found",
    noResultsHint: "Try a different search or category.",
    clearFilters: "Clear filters",
    loadMore: "Load more",
    readLyrics: "Read lyrics",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    submittedBy: "Submitted by",
    category: "Category",
    language: "Language",
    lyrics: "Lyrics",
    backToSongs: "Back to the song book",
    backgroundCredit: "Photo by {photographer} on Unsplash",
    backgroundFallback: "A calm sky-and-light gradient background",
    edit: "Edit",
    delete: "Delete",
    resubmit: "Resubmit",
  },
  submit: {
    title: "Submit a Song",
    subtitle: "Share a Gospel song. An admin will review it before it appears publicly.",
    signInRequired: "Sign in to submit a song",
    signInRequiredDesc: "Song submissions are available to signed-in members.",
    fieldTitle: "Song title",
    fieldTitleHint: "Up to 120 characters.",
    fieldLanguage: "Language",
    fieldCategory: "Category",
    fieldLyrics: "Lyrics",
    fieldLyricsHint: "Paste the full lyrics. Line breaks are preserved.",
    chooseCategory: "Choose a category",
    chooseLanguage: "Choose a language",
    submit: "Submit for review",
    submitting: "Submitting…",
    successTitle: "Song submitted",
    successDescription: "Your song is pending review. You can track it under My Songs.",
    save: "Save",
    saveChanges: "Save changes",
    cancel: "Cancel",
    editTitle: "Edit Song",
    editSubtitle: "Update the details of this song.",
    charCount: "{count}/{max}",
  },
  mySongs: {
    title: "My Songs",
    subtitle: "Track the songs you have submitted.",
    empty: "You have not submitted any songs yet.",
    emptyHint: "When you submit a song it will appear here with its review status.",
    status: "Status",
    updatedAt: "Updated",
    actions: "Actions",
    view: "View",
  },
  admin: {
    title: "Admin Dashboard",
    subtitle: "Review submissions, manage songs and categories.",
    dashboard: "Dashboard",
    pendingReview: "Pending review",
    pendingReviewDesc: "Approve or reject user-submitted songs.",
    totalSongs: "Total songs",
    approvedSongs: "Approved",
    pendingSongs: "Pending",
    rejectedSongs: "Rejected",
    approve: "Approve",
    reject: "Reject",
    approveConfirmTitle: "Approve this song?",
    approveConfirmDescription: "The song will appear in the public song book immediately.",
    rejectConfirmTitle: "Reject this song?",
    rejectConfirmDescription: "The author can edit and resubmit the song later.",
    reviewNote: "Review note",
    reviewNoteOptional: "Review note (optional)",
    confirm: "Confirm",
    cancel: "Cancel",
    noPending: "Nothing to review",
    noPendingDesc: "All submitted songs have been reviewed.",
    manageCategories: "Manage categories",
    manageCategoriesDesc: "Edit the bilingual category names or add new categories.",
    categoriesTitle: "Categories",
    categoriesSubtitle: "Categories appear in both languages across the site.",
    categorySlug: "Slug",
    categoryNameEn: "English name",
    categoryNameHi: "Hindi name",
    categorySortOrder: "Sort order",
    addCategory: "Add category",
    updateCategory: "Update category",
    deleteCategory: "Delete",
    deleteCategoryConfirm: "Delete this category? This cannot be undone.",
    deleteCategoryBlocked: "This category still contains songs. Move or delete them first.",
    editSong: "Edit",
    deleteSong: "Delete",
    deleteSongConfirm: "Delete this song?",
    deleteSongConfirmDesc: "The song will be permanently removed. This cannot be undone.",
    accessDenied: "Admins only",
    accessDeniedDesc: "You need an administrator account to view this page.",
    allSongs: "All songs",
  },
  auth: {
    signInTitle: "Sign in",
    signInSubtitle: "Sign in with the email and password issued by the site administrator.",
    signInAction: "Sign in",
    signingIn: "Signing in…",
    email: "Email",
    password: "Password",
    invalidCredentials: "Incorrect email or password. After 5 failed attempts sign-in is locked for 15 minutes.",
    signOutConfirm: "Sign out of WorshipJesusChrist?",
    signedInAs: "Signed in as",
    securityNote: "Passwords are stored as salted scrypt hashes. Sessions use secure, httpOnly cookies.",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    network: "Network error. Check your connection and try again.",
    unauthorized: "Please sign in to continue.",
    forbidden: "You do not have permission to do that.",
    notFound: "We could not find what you were looking for.",
    validation: "Please check the highlighted fields.",
    conflict: "That change conflicts with the current state.",
    tryAgain: "Try again",
  },
  status: {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    pendingHint: "Waiting for an admin to review.",
    approvedHint: "Live in the public song book.",
    rejectedHint: "Not published. You can edit and resubmit.",
  },
  footer: {
    builtWith: "Built with Next.js, SQLite and Unsplash.",
    rights: "WorshipJesusChrist — a bilingual Gospel song book.",
    unsplashNote: "Background photography from Unsplash, with photographer credit.",
  },
  common: {
    loading: "Loading…",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    page: "Page",
    of: "of",
    unnamed: "Untitled",
    required: "required",
    optional: "optional",
  },
};

const hi: Dictionary = {
  meta: {
    title: "WorshipJesusChrist — सुसमाचार गीत पुस्तिका",
    tagline: "द्विभाषी सुसमाचार गीत पुस्तिका",
    description:
      "एक शांत, द्विभाषी (अंग्रेज़ी और हिंदी) सुसमाचार गीत पुस्तिका — आराधना, प्रार्थना, ईस्टर, गुड फ्राइडे, पाम संडे और क्रिसमस गीतों के साथ।",
  },
  nav: {
    home: "मुखपृष्ठ",
    songs: "गीत पुस्तिका",
    submit: "गीत जमा करें",
    mySongs: "मेरे गीत",
    admin: "व्यवस्थापक",
    signIn: "साइन इन करें",
    signOut: "साइन आउट करें",
    language: "भाषा",
    switchLanguage: "भाषा बदलें",
  },
  landing: {
    heading: "WorshipJesusChrist",
    subheading: "एक द्विभाषी सुसमाचार गीत पुस्तिका — English & हिंदी",
    chooseLanguage: "Choose your language / अपनी भाषा चुनें",
    english: "English",
    hindi: "हिंदी",
    enterEnglish: "Continue in English",
    enterHindi: "हिंदी में जारी रखें",
  },
  home: {
    heroTitle: "सुसमाचार के गीत गाएँ — अंग्रेज़ी और हिंदी में",
    heroSubtitle:
      "आराधना, प्रार्थना और पर्वों के गीत पढ़ें। बोल पढ़ें, गीत पुस्तिका में खोजें, और वे गीत साझा करें जो परमेश्वर ने आपके हृदय में रखे हैं।",
    browseByCategory: "श्रेणी के अनुसार देखें",
    categoriesSubtitle: "हर श्रेणी अंग्रेज़ी और हिंदी दोनों में उपलब्ध है।",
    recentSongs: "हाल ही में जोड़े गए गीत",
    recentSubtitle: "हमारे संपादकों द्वारा स्वीकृत गीत, नए से पुराने।",
    searchPlaceholder: "गीत या बोल खोजें…",
    search: "खोजें",
    viewAllSongs: "पूरी गीत पुस्तिका देखें",
    submitSong: "गीत जमा करें",
    howItWorks: "यह कैसे काम करता है",
    stepSignIn: "अपने खाते से साइन इन करें",
    stepSignInDesc: "साइट व्यवस्थापक द्वारा दिए गए ईमेल और पासवर्ड का उपयोग करें।",
    stepSubmit: "अपना गीत जमा करें",
    stepSubmitDesc: "शीर्षक, भाषा, श्रेणी और बोल जोड़ें। जमा किए गए गीत 'लंबित' रहते हैं।",
    stepReview: "संपादक समीक्षा",
    stepReviewDesc: "व्यवस्थापक स्वीकृति के बाद गीत तुरंत गीत पुस्तिका में दिखाई देता है।",
  },
  songs: {
    title: "गीत पुस्तिका",
    subtitle: "स्वीकृत सुसमाचार गीतों को देखें और खोजें।",
    allCategories: "सभी श्रेणियाँ",
    allLanguages: "सभी भाषाएँ",
    english: "अंग्रेज़ी",
    hindi: "हिंदी",
    searchLabel: "खोजें",
    searchPlaceholder: "शीर्षक या बोल खोजें…",
    results: "गीत",
    noResults: "कोई गीत नहीं मिला",
    noResultsHint: "कोई और खोज या श्रेणी आज़माएँ।",
    clearFilters: "फ़िल्टर हटाएँ",
    loadMore: "और देखें",
    readLyrics: "बोल पढ़ें",
    pending: "लंबित",
    approved: "स्वीकृत",
    rejected: "अस्वीकृत",
    submittedBy: "जमा कर्ता",
    category: "श्रेणी",
    language: "भाषा",
    lyrics: "बोल",
    backToSongs: "गीत पुस्तिका पर वापस जाएँ",
    backgroundCredit: "Photo by {photographer} on Unsplash",
    backgroundFallback: "आकाश और प्रकाश का शांत ग्रेडिएंट पृष्ठभूमि",
    edit: "संपादित करें",
    delete: "हटाएँ",
    resubmit: "पुनः जमा करें",
  },
  submit: {
    title: "गीत जमा करें",
    subtitle: "एक सुसमाचार गीत साझा करें। सार्वजनिक रूप से दिखने से पहले व्यवस्थापक उसकी समीक्षा करेगा।",
    signInRequired: "गीत जमा करने के लिए साइन इन करें",
    signInRequiredDesc: "गीत जमा करना केवल साइन-इन सदस्यों के लिए उपलब्ध है।",
    fieldTitle: "गीत का शीर्षक",
    fieldTitleHint: "अधिकतम 120 अक्षर।",
    fieldLanguage: "भाषा",
    fieldCategory: "श्रेणी",
    fieldLyrics: "बोल",
    fieldLyricsHint: "पूरे बोल यहाँ पेस्ट करें। पंक्ति विभाजन यथावत रहेंगे।",
    chooseCategory: "श्रेणी चुनें",
    chooseLanguage: "भाषा चुनें",
    submit: "समीक्षा के लिए जमा करें",
    submitting: "जमा हो रहा है…",
    successTitle: "गीत जमा हो गया",
    successDescription: "आपका गीत समीक्षा के लिए लंबित है। आप इसे 'मेरे गीत' में देख सकते हैं।",
    save: "सहेजें",
    saveChanges: "परिवर्तन सहेजें",
    cancel: "रद्द करें",
    editTitle: "गीत संपादित करें",
    editSubtitle: "इस गीत का विवरण अपडेट करें।",
    charCount: "{count}/{max}",
  },
  mySongs: {
    title: "मेरे गीत",
    subtitle: "आपके द्वारा जमा किए गए गीतों की स्थिति देखें।",
    empty: "आपने अभी तक कोई गीत जमा नहीं किया है।",
    emptyHint: "जब आप कोई गीत जमा करेंगे तो वह यहाँ उसकी स्थिति के साथ दिखाई देगा।",
    status: "स्थिति",
    updatedAt: "अपडेट",
    actions: "क्रियाएँ",
    view: "देखें",
  },
  admin: {
    title: "व्यवस्थापक डैशबोर्ड",
    subtitle: "जमा किए गए गीतों की समीक्षा करें, गीत और श्रेणियाँ प्रबंधित करें।",
    dashboard: "डैशबोर्ड",
    pendingReview: "समीक्षा लंबित",
    pendingReviewDesc: "उपयोगकर्ताओं द्वारा जमा किए गए गीतों को स्वीकृत या अस्वीकृत करें।",
    totalSongs: "कुल गीत",
    approvedSongs: "स्वीकृत",
    pendingSongs: "लंबित",
    rejectedSongs: "अस्वीकृत",
    approve: "स्वीकृत करें",
    reject: "अस्वीकृत करें",
    approveConfirmTitle: "क्या यह गीत स्वीकृत करें?",
    approveConfirmDescription: "यह गीत तुरंत सार्वजनिक गीत पुस्तिका में दिखाई देगा।",
    rejectConfirmTitle: "क्या यह गीत अस्वीकृत करें?",
    rejectConfirmDescription: "लेखक बाद में गीत को संपादित करके पुनः जमा कर सकता है।",
    reviewNote: "समीक्षा टिप्पणी",
    reviewNoteOptional: "समीक्षा टिप्पणी (वैकल्पिक)",
    confirm: "पुष्टि करें",
    cancel: "रद्द करें",
    noPending: "समीक्षा के लिए कुछ नहीं",
    noPendingDesc: "सभी जमा किए गए गीतों की समीक्षा हो चुकी है।",
    manageCategories: "श्रेणियाँ प्रबंधित करें",
    manageCategoriesDesc: "द्विभाषी श्रेणी नाम संपादित करें या नई श्रेणियाँ जोड़ें।",
    categoriesTitle: "श्रेणियाँ",
    categoriesSubtitle: "श्रेणियाँ पूरी साइट पर दोनों भाषाओं में दिखाई देती हैं।",
    categorySlug: "स्लग",
    categoryNameEn: "अंग्रेज़ी नाम",
    categoryNameHi: "हिंदी नाम",
    categorySortOrder: "क्रम संख्या",
    addCategory: "श्रेणी जोड़ें",
    updateCategory: "श्रेणी अपडेट करें",
    deleteCategory: "हटाएँ",
    deleteCategoryConfirm: "क्या यह श्रेणी हटाएँ? यह वापस नहीं हो सकता।",
    deleteCategoryBlocked: "इस श्रेणी में अभी भी गीत हैं। पहले उन्हें स्थानांतरित या हटाएँ।",
    editSong: "संपादित करें",
    deleteSong: "हटाएँ",
    deleteSongConfirm: "क्या यह गीत हटाएँ?",
    deleteSongConfirmDesc: "यह गीत स्थायी रूप से हटा दिया जाएगा। यह वापस नहीं हो सकता।",
    accessDenied: "केवल व्यवस्थापक",
    accessDeniedDesc: "यह पृष्ठ देखने के लिए व्यवस्थापक खाता आवश्यक है।",
    allSongs: "सभी गीत",
  },
  auth: {
    signInTitle: "साइन इन करें",
    signInSubtitle: "साइट व्यवस्थापक द्वारा दिए गए ईमेल और पासवर्ड से साइन इन करें।",
    signInAction: "साइन इन करें",
    signingIn: "साइन इन हो रहा है…",
    email: "ईमेल",
    password: "पासवर्ड",
    invalidCredentials: "ईमेल या पासवर्ड गलत है। 5 असफल प्रयासों के बाद 15 मिनट के लिए साइन इन बंद हो जाता है।",
    signOutConfirm: "WorshipJesusChrist से साइन आउट करें?",
    signedInAs: "साइन इन उपयोगकर्ता",
    securityNote: "पासवर्ड साल्टेड scrypt हैश के रूप में संग्रहीत होते हैं। सत्र सुरक्षित, httpOnly कुकीज़ का उपयोग करते हैं।",
  },
  errors: {
    generic: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    network: "नेटवर्क त्रुटि। अपना कनेक्शन जाँचें और पुनः प्रयास करें।",
    unauthorized: "जारी रखने के लिए कृपया साइन इन करें।",
    forbidden: "आपके पास ऐसा करने की अनुमति नहीं है।",
    notFound: "जो आप खोज रहे थे वह नहीं मिला।",
    validation: "कृपया चिह्नित फ़ील्ड जाँचें।",
    conflict: "यह परिवर्तन वर्तमान स्थिति से टकराता है।",
    tryAgain: "पुनः प्रयास करें",
  },
  status: {
    pending: "लंबित",
    approved: "स्वीकृत",
    rejected: "अस्वीकृत",
    pendingHint: "व्यवस्थापक की समीक्षा की प्रतीक्षा है।",
    approvedHint: "सार्वजनिक गीत पुस्तिका में प्रकाशित।",
    rejectedHint: "प्रकाशित नहीं। आप संपादित करके पुनः जमा कर सकते हैं।",
  },
  footer: {
    builtWith: "Next.js, SQLite और Unsplash के साथ निर्मित।",
    rights: "WorshipJesusChrist — एक द्विभाषी सुसमाचार गीत पुस्तिका।",
    unsplashNote: "पृष्ठभूमि चित्र Unsplash से, फ़ोटोग्राफ़र क्रेडिट के साथ।",
  },
  common: {
    loading: "लोड हो रहा है…",
    close: "बंद करें",
    back: "वापस",
    next: "अगला",
    previous: "पिछला",
    page: "पृष्ठ",
    of: "में से",
    unnamed: "बिना शीर्षक",
    required: "आवश्यक",
    optional: "वैकल्पिक",
  },
};

export const dictionaries: Record<string, Dictionary> = { en, hi };

export function getDictionary(locale: string): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

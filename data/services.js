/* ============================================================
   WorseWatch — seed dataset v0.1
   ------------------------------------------------------------
   HAND-COLLECTED, EDITORIAL SEED DATA.
   Prices are US list prices (no taxes), roughly-remembered from
   public reporting. Every event carries a confidence level:
     "news"      = widely reported, dated
     "editorial" = synthesized / approximate, verify before citing
   "price"-type events do NOT feed the paywall/cuts sub-score
   (price changes are measured directly from `plans`). They exist
   for the timeline + feed only.
   ============================================================ */

window.WW_SERVICES = {

  /* ---------------------------------- STREAMING / MEDIA -- */

  netflix: {
    name: "Netflix",
    category: "Streaming",
    short: "Video streaming. Once promised: no ads, ever.",
    plans: [
      { name: "Ads",        history: [["2022-11", 6.99], ["2025-01", 7.99]] },
      { name: "Standard", flagship: true,   history: [["2019-01", 12.99], ["2020-11", 13.99], ["2022-01", 15.49], ["2025-01", 17.99]] },
      { name: "Premium",    history: [["2019-01", 15.99], ["2021-10", 19.99], ["2023-10", 22.99], ["2025-01", 24.99]] }
    ],
    ratings: {
      note: "US App Store, editorial series",
      series: [["2023-03", 4.6], ["2023-09", 4.6], ["2024-03", 4.5], ["2024-09", 4.5], ["2025-03", 4.4], ["2025-09", 4.4]]
    },
    events: [
      { d: "2022-11", t: "worse",  impact: 3, conf: "news",
        title: "Ads arrive — the 'no ads ever' promise is retired",
        detail: "Netflix launches a $6.99/mo ad-supported tier, reversing a decade of marketing built on being ad-free.",
        src: "Netflix announcement, Nov 2022" },
      { d: "2023-01", t: "worse",  impact: 4, conf: "news",
        title: "Password-sharing crackdown begins",
        detail: "Household verification rolls out; an 'extra member' fee (~$7.99/mo) is added for people outside the household.",
        src: "Netflix product update, Jan 2023" },
      { d: "2023-10", t: "price",  impact: 3, conf: "news",
        title: "Premium jumps $19.99 → $22.99",
        detail: "US price hike; Basic is retired for new subscribers earlier the same year.",
        src: "Netflix pricing page, Oct 2023" },
      { d: "2025-01", t: "price",  impact: 3, conf: "news",
        title: "US across-the-board hike",
        detail: "Standard $15.49 → $17.99, Premium $22.99 → $24.99, Ads $6.99 → $7.99 — the first hike that touches every plan including Ads.",
        src: "Reported Jan 2025 (verify)" }
    ]
  },

  "disney-plus": {
    name: "Disney+",
    category: "Streaming",
    short: "The launch-cheap, then-climb-hard playbook.",
    plans: [
      { name: "Premium (no ads)", flagship: true, history: [["2019-11", 6.99], ["2021-03", 7.99], ["2022-12", 10.99], ["2023-10", 13.99], ["2024-10", 15.99]] },
      { name: "Basic (ads)",      history: [["2022-12", 7.99], ["2024-10", 9.99]] }
    ],
    ratings: {
      note: "US App Store, editorial series",
      series: [["2023-03", 4.6], ["2023-09", 4.4], ["2024-03", 4.3], ["2024-09", 4.2], ["2025-03", 4.1], ["2025-09", 4.0]]
    },
    events: [
      { d: "2022-12", t: "price", impact: 3, conf: "news",
        title: "Launch price era ends: $6.99 → $7.99 ads / $10.99 no-ads",
        detail: "First major hike only three years after launch; an ad-supported tier appears the same day.",
        src: "Disney+ pricing, Dec 2022" },
      { d: "2023-10", t: "price", impact: 3, conf: "news",
        title: "No-ads tier climbs again: $10.99 → $13.99",
        detail: "Ad-free keeps getting pricier while the ads tier stays 'cheap'. The classic two-tier squeeze.",
        src: "Disney+ pricing, Oct 2023" },
      { d: "2024-09", t: "worse", impact: 3, conf: "news",
        title: "Password-sharing crackdown",
        detail: "Follows Netflix's playbook: paid sharing enforcement begins, with an 'add a member' upsell.",
        src: "Widely reported, Sep 2024" },
      { d: "2024-10", t: "price", impact: 3, conf: "editorial",
        title: "Two hikes inside 24 months",
        detail: "Premium reaches ~$15.99 — more than double the 2021 price. Verify exact figures for your region.",
        src: "Editorial synthesis" }
    ]
  },

  spotify: {
    name: "Spotify",
    category: "Streaming",
    short: "Music streaming. First-ever US price hike after 12 years flat.",
    plans: [
      { name: "Premium Individual", flagship: true, history: [["2016-06", 9.99], ["2023-07", 10.99], ["2024-06", 11.99], ["2025-09", 12.99]] },
      { name: "Premium Family",    history: [["2016-06", 14.99], ["2023-07", 16.99], ["2024-06", 19.99]] }
    ],
    ratings: {
      note: "US App Store, editorial series",
      series: [["2023-03", 4.8], ["2023-09", 4.8], ["2024-03", 4.7], ["2024-09", 4.7], ["2025-03", 4.6], ["2025-09", 4.6]]
    },
    events: [
      { d: "2023-07", t: "price", impact: 3, conf: "news",
        title: "First-ever US price hike",
        detail: "Premium Individual $9.99 → $10.99, Family $14.99 → $16.99 after 12 years of $9.99.",
        src: "Spotify newsroom, Jul 2023" },
      { d: "2023-11", t: "worse", impact: 3, conf: "news",
        title: "Audiobook hours quietly capped",
        detail: "The 'audiobooks included' perk launched in 2023 is capped at 15 hours/month — an upsell dressed as inclusion.",
        src: "Spotify support docs" },
      { d: "2024-06", t: "price", impact: 3, conf: "news",
        title: "Second hike in 12 months",
        detail: "Individual $10.99 → $11.99, Family $16.99 → $19.99 (+17.8%).",
        src: "Spotify newsroom, Jun 2024" },
      { d: "2025-09", t: "price", impact: 3, conf: "editorial",
        title: "Third hike reported",
        detail: "Individual reportedly reaches $12.99 in some markets. Yearly hikes become the new normal.",
        src: "Editorial synthesis (verify)" },
      { d: "2023-04", t: "better", impact: 2, conf: "news",
        title: "AI DJ launches",
        detail: "Genuine product addition (Parkinson's-law caveat: how long until it is walled behind a higher tier?).",
        src: "Spotify newsroom, Apr 2023" }
    ]
  },

  youtube: {
    name: "YouTube",
    category: "Streaming",
    short: "Free video + ever-heavier ad load and a war on ad blockers.",
    plans: [
      { name: "Premium Individual", flagship: true, history: [["2018-05", 11.99], ["2023-05", 13.99]] }
    ],
    ratings: {
      note: "US App Store, editorial series",
      series: [["2023-03", 4.4], ["2023-09", 4.4], ["2024-03", 4.3], ["2024-09", 4.3], ["2025-03", 4.3], ["2025-09", 4.2]]
    },
    events: [
      { d: "2021-11", t: "worse",  impact: 2, conf: "news",
        title: "Public dislike counts removed",
        detail: "Creators and viewers lose a quality signal. Outside the 3-year scoring window soon — the decay will erase its points, by design.",
        src: "YouTube announcement, Nov 2021" },
      { d: "2023-06", t: "worse",  impact: 4, conf: "news",
        title: "Ad-blocker crackdown",
        detail: "'Ad blockers are not allowed on YouTube' — playback blocking, warnings, and detection escalations begin.",
        src: "Widely reported, mid-2023" },
      { d: "2023-05", t: "price",  impact: 3, conf: "news",
        title: "Premium US hike: $11.99 → $13.99",
        detail: "First US Premium hike in roughly five years; more follow in other markets.",
        src: "YouTube, May 2023" },
      { d: "2024-06", t: "worse",  impact: 2, conf: "editorial",
        title: "Ad load keeps creeping",
        detail: "More unskippable slots, more mid-rolls per video — measurable, but no official release note ever says 'more ads'.",
        src: "Editorial synthesis" }
    ]
  },

  /* ---------------------------------- SOCIAL -- */

  "twitter-x": {
    name: "X (Twitter)",
    category: "Social",
    short: "The fastest un-bundling in consumer software history.",
    plans: [
      { name: "X Premium (Basic)", flagship: true, history: [["2022-11", 8.00]] }
    ],
    ratings: {
      note: "US App Store, editorial series",
      series: [["2023-03", 4.2], ["2023-09", 4.1], ["2024-03", 4.0], ["2024-09", 4.0], ["2025-03", 3.9], ["2025-09", 3.9]]
    },
    events: [
      { d: "2022-10", t: "worse", impact: 3, conf: "news",
        title: "Half the company laid off in a week",
        detail: "~50% staff cut; trust-and-safety, comms, and infrastructure teams hollowed out. Reliability and moderation degrade afterward.",
        src: "Widely reported, Nov 2022" },
      { d: "2022-11", t: "worse", impact: 4, conf: "news",
        title: "Paid checkmarks detonate",
        detail: "Blue-for-$8 launches, impersonation chaos follows (pharma companies, sports teams), relay is paused and relaunched with tiers.",
        src: "Nov 2022" },
      { d: "2023-02", t: "worse", impact: 3, conf: "news",
        title: "API access gutted",
        detail: "Free API effectively killed; hundreds of research and accessibility bots die overnight.",
        src: "Feb 2023" },
      { d: "2023-06", t: "worse", impact: 4, conf: "news",
        title: "Third-party clients killed",
        detail: "Tweetbot, Twitterrific et al. receive termination notices and do not survive the new API pricing.",
        src: "Jun 2023" },
      { d: "2023-07", t: "worse", impact: 3, conf: "news",
        title: "Daily view rate limits",
        detail: "'Temporary' limits on reading posts (verified users included) — repeated several times over the following year.",
        src: "Jul 2023" },
      { d: "2023-08", t: "worse", impact: 2, conf: "news",
        title: "Headlines stripped from links",
        detail: "Cards show domain only; publishers scramble. Partially walked back later.",
        src: "Aug 2023" },
      { d: "2023-04", t: "better", impact: 2, conf: "news",
        title: "Community Notes expands globally",
        detail: "The one unambiguous improvement: contributor-run fact-checking opened up worldwide.",
        src: "Community Notes, 2022–2023" }
    ]
  },

  reddit: {
    name: "Reddit",
    category: "Social",
    short: "API apocalypse summer, then IPO.",
    plans: [
      { name: "Reddit Premium", flagship: true, history: [["2018-06", 5.99]] }
    ],
    ratings: {
      note: "US App Store, editorial series",
      series: [["2023-03", 4.8], ["2023-09", 4.8], ["2024-03", 4.7], ["2024-09", 4.7], ["2025-03", 4.6], ["2025-09", 4.6]]
    },
    events: [
      { d: "2023-05", t: "worse", impact: 4, conf: "news",
        title: "API pricing announced — apps given weeks to live",
        detail: "Exorbitant per-call pricing lands without negotiation; Apollo, Reddit is Fun, Narwhal announce shutdowns.",
        src: "Apr–May 2023" },
      { d: "2023-06", t: "worse", impact: 3, conf: "news",
        title: "Blackout crackdown",
        detail: "Thousands of subreddits go dark in protest; management threatens to remove volunteer mods who keep them dark.",
        src: "Jun 2023" },
      { d: "2023-06", t: "worse", impact: 2, conf: "editorial",
        title: "Data licensing for AI, users uncompensated",
        detail: "Training-data licensing deals are signed ahead of the IPO; the content creators made is sold without their opt-out.",
        src: "Editorial synthesis" }
    ]
  },

  /* ---------------------------------- SOFTWARE -- */

  adobe: {
    name: "Adobe",
    category: "Software",
    short: "The subscription you literally cannot cancel easily.",
    plans: [
      { name: "Creative Cloud All Apps", flagship: true, history: [["2015-01", 49.99], ["2018-10", 52.99], ["2022-08", 54.99], ["2024-11", 59.99]] }
    ],
    ratings: null,
    events: [
      { d: "2024-06", t: "worse", impact: 4, conf: "news",
        title: "FTC sues Adobe over hidden cancellation fees",
        detail: "Regulators allege consumers were enrolled in annual plans without clear disclosure and hit with punitive early-termination fees.",
        src: "FTC complaint, Jun 2024" },
      { d: "2024-11", t: "worse", impact: 3, conf: "news",
        title: "Terms-of-service trust collapse, walked back",
        detail: "New ToS language suggesting Adobe could access user content to police 'prohibited' uses detonates; Adobe walks it back within days.",
        src: "Nov 2024" },
      { d: "2023-08", t: "worse", impact: 3, conf: "editorial",
        title: "Generative credits introduced",
        detail: "Firefly generation gets metered with monthly credits — CPU-like rationing for a cloud tool. Caps tighten over time.",
        src: "Editorial synthesis" },
      { d: "2022-08", t: "price", impact: 3, conf: "editorial",
        title: "~5% annual price creep as policy",
        detail: "All-Apps climbs year over year ($49.99 → $59.99 by 2024) with no feature bundles to justify it mostly.",
        src: "Editorial synthesis" }
    ]
  },

  evernote: {
    name: "Evernote",
    category: "Software",
    short: "The cautionary tale. Gutted free tier, gutted company.",
    plans: [
      { name: "Personal", flagship: true, history: [["2021-06", 7.99], ["2023-04", 9.99], ["2024-06", 11.99]] }
    ],
    ratings: {
      note: "US App Store, editorial series",
      series: [["2023-03", 4.6], ["2023-09", 4.4], ["2024-03", 4.1], ["2024-09", 3.9], ["2025-03", 3.7], ["2025-09", 3.6]]
    },
    events: [
      { d: "2022-11", t: "worse", impact: 5, conf: "news",
        title: "Free plan crippled: 50 notes, 1 device",
        detail: "Free tier slashed from thousands of notes + 2 devices to 50 notes and a single device — one of the harshest downgrades on record.",
        src: "Evernote announcement, Nov 2022" },
      { d: "2023-07", t: "worse", impact: 4, conf: "news",
        title: "Bending Spoons lays off most of the company",
        detail: "New owner terminates a large share of remaining staff, mostly US-based; community trust collapses.",
        src: "Widely reported, Jul 2023" },
      { d: "2023-06", t: "worse", impact: 3, conf: "editorial",
        title: "Price hikes + AI upsell stacking",
        detail: "Paid tiers jump (Personal ~$7.99 → ~$10+), while 'Early Access' AI features dangle above them.",
        src: "Editorial synthesis" },
      { d: "2024-01", t: "worse", impact: 2, conf: "editorial",
        title: "Legacy app sunset forces migration",
        detail: "The old (loved, offline-capable) client is deprecated; users are pushed onto the slower Electron rewrite.",
        src: "Editorial synthesis" }
    ]
  },

  dropbox: {
    name: "Dropbox",
    category: "Software",
    short: "Decent sync, inflating prices, AI-dash upsell.",
    plans: [
      { name: "Plus", flagship: true, history: [["2015-06", 9.99], ["2023-03", 11.99], ["2024-06", 11.99]] }
    ],
    ratings: {
      note: "US App Store, editorial series",
      series: [["2023-03", 4.3], ["2023-09", 4.2], ["2024-03", 4.1], ["2024-09", 4.0], ["2025-03", 3.9], ["2025-09", 3.9]]
    },
    events: [
      { d: "2023-03", t: "price", impact: 3, conf: "news",
        title: "~20% price increase across many markets",
        detail: "Plus/Standard plans rise ~$2/mo in the US and substantially more in some regions.",
        src: "Reported Mar 2023" },
      { d: "2024-08", t: "worse", impact: 2, conf: "editorial",
        title: "AI Dash upsell reshuffles tiers",
        detail: "New 'Essentials'-style AI bundles appear; the simple 'more storage for money' promise blurs into feature tiers.",
        src: "Editorial synthesis" },
      { d: "2021-06", t: "better", impact: 2, conf: "news",
        title: "Passwords + Vault land at no extra cost",
        detail: "A rare case of useful features shipping inside existing plans. (Pre-window decay applies.)",
        src: "Jun 2021" }
    ]
  },

  kagi: {
    name: "Kagi",
    category: "Search",
    short: "Anti-enshittification exhibit: paid, no ads, cheap and stable.",
    plans: [
      { name: "Professional", flagship: true, history: [["2022-06", 10.00]] }
    ],
    ratings: null,
    events: [
      { d: "2023-05", t: "better", impact: 2, conf: "editorial",
        title: "Search quality keeps compounding",
        detail: "Continuous filtering and personalization improvements ship without price hikes or feature paywalls.",
        src: "Editorial synthesis" },
      { d: "2023-10", t: "better", impact: 2, conf: "editorial",
        title: "Small Web + other experiments",
        detail: "Non-enshittified extras: supporting the small web, limiter defaults — paid users get more, not less.",
        src: "Editorial synthesis" }
    ]
  },

  /* ---------------------------------- CONSUMER -- */

  "amazon-prime": {
    name: "Amazon Prime",
    category: "Consumer",
    short: "Shipping as the loss leader, ads as the growth lever.",
    plans: [
      { name: "Prime (annual)", flagship: true,           history: [["2018-05", 119.00], ["2022-02", 139.00]] },
      { name: "Prime Video ad-free add-on", history: [["2024-01", 2.99]] }
    ],
    ratings: {
      note: "US App Store (Shopping), editorial series",
      series: [["2023-03", 4.8], ["2023-09", 4.7], ["2024-03", 4.7], ["2024-09", 4.7], ["2025-03", 4.6], ["2025-09", 4.6]]
    },
    events: [
      { d: "2022-02", t: "price", impact: 3, conf: "news",
        title: "$119 → $139/yr",
        detail: "First hike in years (~17%); lands just outside or at the edge of the scoring window depending on the day you read it.",
        src: "Feb 2022" },
      { d: "2024-01", t: "worse", impact: 4, conf: "news",
        title: "Ads on by default, $2.99/mo to opt out",
        detail: "Prime Video becomes ad-supported overnight; the ad-free experience you already paid for becomes an add-on.",
        src: "Announced Dec 2023, live Jan 2024" },
      { d: "2025-06", t: "worse", impact: 2, conf: "editorial",
        title: "Ad load ramps",
        detail: "Ad frequency climbs toward TV levels; the 'ads are only the beginning' memo plays out as predicted.",
        src: "Editorial synthesis" },
      { d: "2023-06", t: "better", impact: 2, conf: "editorial",
        title: "RxPass ships",
        detail: "Genuine benefit: $5/mo unlimited generic meds for Prime members (US).",
        src: "Jun 2023" }
    ]
  },

  uber: {
    name: "Uber",
    category: "Mobility",
    short: "Opaque pricing everywhere, all at once.",
    plans: [
      { name: "Uber One", flagship: true, history: [["2021-11", 9.99]] }
    ],
    ratings: {
      note: "US App Store, editorial series",
      series: [["2023-03", 4.8], ["2023-09", 4.8], ["2024-03", 4.8], ["2024-09", 4.7], ["2025-03", 4.7], ["2025-09", 4.7]]
    },
    events: [
      { d: "2023-06", t: "worse", impact: 3, conf: "editorial",
        title: "Upfront-pricing algorithm redraws driver pay",
        detail: "Fares shown to riders and payouts to drivers diverge; the gap becomes a documented driver complaint.",
        src: "Driver forums + reporting" },
      { d: "2023-03", t: "worse", impact: 3, conf: "editorial",
        title: "Fee stack-up War",
        detail: "Service, booking, regulatory, and surge chunks pile into one opaque quote; the 'price you see' rarely matches the math.",
        src: "Editorial synthesis" },
      { d: "2023-12", t: "better", impact: 2, conf: "news",
        title: "Price Lock arrives",
        detail: "A real fix for commuter routes — pay a locked price for the same trip. Caveats apply; watch this space.",
        src: "Dec 2023" },
      { d: "2024-03", t: "worse", impact: 2, conf: "editorial",
        title: "Surge geography broadens",
        detail: "More trips quote dynamically; 'upfront pricing' doubles as anti-transparency.",
        src: "Editorial synthesis" }
    ]
  }
};

/* Metadata for the home page stats + wishlist section */
window.WW_META = {
  version: "v0.1 seed",
  updated: "2025-10",
  nextToTrack: [
    "Adobe Photoshop (single-app pricing maze)",
    "Airbnb (fees + founder-era pricing)",
    "Notion (free-tier squeeze?)",
    "Paramount+ / Peacock (ad tiers)",
    "Grammarly (post-AI positioning)",
    "Canva (price + AI credit creep)"
  ]
};

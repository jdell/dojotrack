/**
 * Requirements Library — curated belt requirements by discipline that club
 * owners can browse and import into their club's belt ranks.
 *
 * Each discipline has a set of belts, each with categorised requirements.
 * The Kenpo/Kenpo section uses the full American Kenpo curriculum (Ed Parker
 * system). BJJ, Karate, and Judo have a representative set of common
 * requirements.
 */

export interface LibraryRequirement {
  name: string;
  description?: string;
  type: "TIME" | "CLASSES" | "TECHNIQUE" | "COMPETITION" | "CUSTOM";
  targetValue?: number;
  ageGroup: "common" | "adults" | "children";
  category: string;
}

export interface LibraryBelt {
  beltName: string;
  requirements: LibraryRequirement[];
}

export interface LibraryDiscipline {
  discipline: string;
  label: string;
  belts: LibraryBelt[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function technique(
  name: string,
  description?: string,
  ageGroup: LibraryRequirement["ageGroup"] = "common",
): LibraryRequirement {
  return { name, description, type: "TECHNIQUE", ageGroup, category: "techniques" };
}

function form(
  name: string,
  description?: string,
  ageGroup: LibraryRequirement["ageGroup"] = "common",
): LibraryRequirement {
  return { name, description, type: "TECHNIQUE", ageGroup, category: "forms" };
}

function set(
  name: string,
  description?: string,
  ageGroup: LibraryRequirement["ageGroup"] = "common",
): LibraryRequirement {
  return { name, description, type: "TECHNIQUE", ageGroup, category: "sets" };
}

function timeReq(
  months: number,
  description?: string,
): LibraryRequirement {
  return {
    name: `Minimum time at previous rank`,
    description: description ?? `${months} months at previous rank`,
    type: "TIME",
    targetValue: months,
    ageGroup: "common",
    category: "time",
  };
}

function classesReq(
  count: number,
  description?: string,
): LibraryRequirement {
  return {
    name: `Minimum classes attended`,
    description: description ?? `${count} classes since last promotion`,
    type: "CLASSES",
    targetValue: count,
    ageGroup: "common",
    category: "time",
  };
}

function sparring(
  name: string,
  description?: string,
  ageGroup: LibraryRequirement["ageGroup"] = "common",
): LibraryRequirement {
  return { name, description, type: "TECHNIQUE", ageGroup, category: "sparring" };
}

function fitness(
  name: string,
  description?: string,
  ageGroup: LibraryRequirement["ageGroup"] = "common",
): LibraryRequirement {
  return { name, description, type: "CUSTOM", ageGroup, category: "fitness" };
}

// ---------------------------------------------------------------------------
// KENPO / KEMPO — American Kenpo (Ed Parker system)
// ---------------------------------------------------------------------------

const KENPO: LibraryDiscipline = {
  discipline: "kenpo",
  label: "Kempo / Kenpo",
  belts: [
    // ── Yellow Belt ──
    {
      beltName: "Yellow Belt",
      requirements: [
        // Time & attendance
        timeReq(2, "2-3 months at White Belt"),
        classesReq(24),
        // Techniques (10 self-defense techniques)
        technique("Delayed Sword", "Right step-through punch"),
        technique("Alternating Maces", "Right step-through punch"),
        technique("Sword of Destruction", "Left roundhouse punch"),
        technique("Deflecting Hammer", "Right front kick"),
        technique("Capturing Twisters", "Right front bear hug, arms pinned"),
        technique("Sword and Hammer", "Right flank, right-hand shoulder grab"),
        technique("Attacking Mace", "Right step-through punch"),
        technique("Checking the Dark", "Left flank, left-hand shoulder grab"),
        technique("Mace of Aggression", "Two-hand lapel grab, pulling in"),
        technique("Triggered Salute", "Right front kick"),
        // Forms
        form("Short Form 1", "Basic blocking form"),
        // Sets
        set("Blocking Set 1", "8 basic blocks"),
        set("Striking Set 1", "Basic striking combinations"),
        // Sparring
        sparring("Basic sparring concepts", "Stance, distancing, timing basics"),
      ],
    },

    // ── Orange Belt ──
    {
      beltName: "Orange Belt",
      requirements: [
        timeReq(3, "3-4 months at Yellow Belt"),
        classesReq(36),
        // Techniques (16)
        technique("Lone Kimono", "Left hand lapel grab"),
        technique("Glancing Salute", "Right step-through uppercut punch"),
        technique("Five Swords", "Right step-through punch"),
        technique("Scraping Hoof", "Full-nelson"),
        technique("Grip of Death", "Left flank, headlock"),
        technique("Locked Wing", "Right flank, hammerlock"),
        technique("Crossed Twigs", "Right cross-hand wrist grab"),
        technique("The Dancer", "Right front kick (step-through)"),
        technique("Thrusting Salute", "Right front kick"),
        technique("Shielding Hammer", "Left hook punch"),
        technique("Striking Serpent's Head", "Left front bear hug, arms free"),
        technique("Crashing Wings", "Right rear bear hug, arms pinned"),
        technique("Obscure Wing", "Left flank, right-hand shoulder grab"),
        technique("Reversing Mace", "Left step-through punch"),
        technique("Charging Ram", "Right front tackle"),
        technique("Thundering Hammers", "Right step-through punch"),
        // Forms
        form("Long Form 1", "First long-range form"),
        // Sets
        set("Blocking Set 2", "Moving stances with blocks"),
        set("Finger Set 1", "Finger strikes and pokes"),
        // Sparring
        sparring("Controlled sparring", "1-step sparring drills"),
      ],
    },

    // ── Purple Belt ──
    {
      beltName: "Purple Belt",
      requirements: [
        timeReq(4, "4-6 months at Orange Belt"),
        classesReq(48),
        // Techniques (18)
        technique("Twisted Twig", "Left wrist lock or twist"),
        technique("Snapping Twig", "Left flank, left-hand push"),
        technique("Leaping Crane", "Right step-through punch"),
        technique("Swinging Pendulum", "Right step-through kick"),
        technique("Thundering Hammers (Extension)", "Right step-through punch"),
        technique("Squeezing the Peach", "Rear bear hug, arms pinned"),
        technique("Calming the Storm", "Right roundhouse club"),
        technique("Darting Mace", "Two-hand lapel grab"),
        technique("Hooking Wings", "Right flank, two-hand push"),
        technique("Shield and Sword", "Left punch, right-hand shoulder push"),
        technique("Bow of Compulsion", "Front left wrist lock"),
        technique("Obstructing the Storm", "Right overhead club"),
        technique("Circling the Horizon", "Right step-through uppercut"),
        technique("Destructive Twins", "Left punch, right punch"),
        technique("Dominating Circles", "Right step-through punch and grab"),
        technique("Detour from Doom", "Right roundhouse kick"),
        technique("Circling Wing", "Two-hand rear choke"),
        technique("Menacing Twirl", "Right front pistol, close range"),
        // Forms
        form("Long Form 2", "Intermediate form with stances and transitions"),
        // Sets
        set("Coordination Set 1", "Kicking and striking coordination"),
        set("Stance Set 1", "Transitional stance work"),
        // Sparring
        sparring("2-step sparring", "Controlled 2-step sparring drills"),
      ],
    },

    // ── Blue Belt ──
    {
      beltName: "Blue Belt",
      requirements: [
        timeReq(4, "4-6 months at Purple Belt"),
        classesReq(60),
        // Techniques (20)
        technique("Buckling Branch", "Left front kick"),
        technique("Thrusting Wedge", "Two-hand push"),
        technique("Flashing Wings", "Right step-through punch"),
        technique("Parting Wings", "Two-hand push (from front)"),
        technique("Raining Claw", "Right uppercut punch"),
        technique("Spiraling Twig", "Left arm lock against arm"),
        technique("Fallen Cross", "Right cross punch"),
        technique("Returning Storm", "Right overhead club"),
        technique("Crossed Swords", "Right cross-hand push or grab"),
        technique("Encounter with Danger", "Two-hand push from behind"),
        technique("Tripping Arrow", "Right flank, right punch"),
        technique("Unfurling Crane", "Right punch, left punch"),
        technique("Glancing Spear", "Left direct wrist grab"),
        technique("Raking Mace", "Right kick followed by right punch"),
        technique("Desperate Falcons", "Right flank, two-hand grab to shoulders"),
        technique("Claw of the Panther", "Right step-through punch"),
        technique("Flight to Freedom", "Rear hammerlock"),
        technique("Gathering Clouds", "Right step-through punch"),
        technique("Destructive Kneel", "Right step-through punch"),
        technique("Circling Destruction", "Rear right roundhouse punch"),
        // Forms
        form("Short Form 2", "Short-range blocking form"),
        // Sets
        set("Coordination Set 2", "Advanced coordination work"),
        set("Stance Set 2", "Advanced transitional stances"),
        // Sparring
        sparring("Semi-free sparring", "Continuous controlled sparring"),
      ],
    },

    // ── Green Belt ──
    {
      beltName: "Green Belt",
      requirements: [
        timeReq(6, "6-9 months at Blue Belt"),
        classesReq(72),
        // Techniques (20)
        technique("Clipping the Storm", "Right roundhouse club"),
        technique("Hammering the Cadaver", "Right front wrist grab, push"),
        technique("Repeated Devastation", "Left step-through punch"),
        technique("Entwined Lance", "Right front knife thrust"),
        technique("Defying the Storm", "Right overhead club"),
        technique("Securing the Storm", "Right flank overhead club"),
        technique("Sleeper", "Right flank, right punch"),
        technique("Brushing the Storm", "Right roundhouse club (overhead)"),
        technique("Conquering Shield", "Left step-through kick, right punch"),
        technique("Striking Fang", "Rear bear hug, arms free, right punch"),
        technique("Dance of Death", "Right front straight knife attack"),
        technique("Marriage of the Rams", "Two-hand grab to both wrists"),
        technique("Ram and the Eagle", "Right front tackle"),
        technique("Blinding Sacrifice", "Right step-through punch"),
        technique("Raining Lance", "Right overhead knife stab"),
        technique("Rotating Destruction", "Right step-through punch"),
        technique("Kneel of Compulsion", "Right flank, headlock"),
        technique("Protecting Fans", "Right and left punch combination"),
        technique("Destructive Fans", "Left and right punch combination"),
        technique("Entangled Wing", "Right arm lock against chest"),
        // Forms
        form("Long Form 3", "Advanced form with movement patterns"),
        // Sets
        set("Finger Set 2", "Advanced finger techniques"),
        // Sparring
        sparring("Free sparring", "Continuous free sparring with control"),
      ],
    },

    // ── 3rd Brown Belt ──
    {
      beltName: "Brown Belt (3rd Degree)",
      requirements: [
        timeReq(6, "6-9 months at Green Belt"),
        classesReq(90),
        // Techniques (16)
        technique("Flashing Mace", "Right step-through punch"),
        technique("Hugging Pendulum", "Right rear bear hug, arms pinned"),
        technique("Repeating Mace", "Left step-through punch"),
        technique("Circles of Protection", "Right looping punch"),
        technique("Devastating Elbow", "Right step-through punch"),
        technique("Escape from Darkness", "Right-hand rear choke"),
        technique("Capturing the Rod", "Right front pistol"),
        technique("Prance of the Tiger", "Right flank, right punch"),
        technique("Broken Ram", "Right front tackle (driving)"),
        technique("Twirling Sacrifice", "Full-nelson"),
        technique("Glancing Lance", "Right front knife thrust"),
        technique("Circling Fans", "Right and left punch combination"),
        technique("Destructive Orbit", "Right step-through punch"),
        technique("Fatal Deviation", "Right hook or roundhouse punch"),
        technique("Wings of Silk", "Rear two-hand choke"),
        technique("Unfurling Lance", "Left hand grab to right wrist"),
        // Forms
        form("Long Form 4", "Movement-based advanced form"),
        // Sets
        set("Two-Man Set", "Partner-based technique set"),
        // Sparring
        sparring("Advanced free sparring", "Full-speed controlled sparring"),
      ],
    },

    // ── 2nd Brown Belt ──
    {
      beltName: "Brown Belt (2nd Degree)",
      requirements: [
        timeReq(6, "6-9 months at 3rd Brown"),
        classesReq(100),
        // Extensions (16) — extensions of prior techniques
        technique("Attacking Mace (Extension)", "Right step-through punch, continued"),
        technique("Sword of Destruction (Extension)", "Left roundhouse punch, continued"),
        technique("Deflecting Hammer (Extension)", "Right front kick, continued"),
        technique("Captured Twigs (Extension)", "Right front bear hug, arms pinned"),
        technique("Checking the Dark (Extension)", "Left flank, left-hand push, continued"),
        technique("Mace of Aggression (Extension)", "Two-hand lapel grab, continued"),
        technique("Triggered Salute (Extension)", "Right front kick, continued"),
        technique("Locked Wing (Extension)", "Right flank, hammerlock, continued"),
        technique("Crossed Twigs (Extension)", "Right cross-hand wrist grab, continued"),
        technique("Crashing Wings (Extension)", "Rear bear hug, arms pinned, continued"),
        technique("Reversing Mace (Extension)", "Left step-through punch, continued"),
        technique("Thundering Hammers (Ext. cont.)", "Right step-through punch, continued"),
        technique("Squeezing the Peach (Extension)", "Rear bear hug, arms pinned, continued"),
        technique("Shield and Sword (Extension)", "Left punch, right shoulder push, continued"),
        technique("Obstructing the Storm (Extension)", "Right overhead club, continued"),
        technique("Destructive Twins (Extension)", "Left and right punch, continued"),
        // Forms
        form("Long Form 5", "Advanced form with extensions"),
        // Sets
        set("Two-Man Set (Extensions)", "Partner set with extended techniques"),
        // Sparring
        sparring("Competition sparring drills", "Point and continuous sparring prep"),
      ],
    },

    // ── 1st Brown Belt ──
    {
      beltName: "Brown Belt (1st Degree)",
      requirements: [
        timeReq(6, "6-12 months at 2nd Brown"),
        classesReq(120),
        // Requirements (4 advanced)
        technique("Thesis on self-defense principles", "Written or demonstrated understanding"),
        technique("Advanced combination techniques", "Original self-defense sequences"),
        technique("Freestyle technique demonstration", "Creative application of principles"),
        technique("Board breaking demonstration", "Speed and power breaks"),
        // Forms
        form("Long Form 6", "Pre-black belt form"),
        // Sets
        set("Club Set", "Defense against club/stick attacks"),
        set("Knife Set", "Defense against knife attacks"),
        // Sparring
        sparring("All-range sparring", "Standup, clinch, and ground awareness"),
        // Fitness
        fitness("Physical fitness test", "Endurance, strength, and flexibility assessment"),
      ],
    },

    // ── 1st Black Belt ──
    {
      beltName: "Black Belt (1st Degree)",
      requirements: [
        timeReq(12, "12-18 months at 1st Brown"),
        classesReq(150),
        // Requirements
        technique("Mastery of all prior techniques", "Demonstrate all Yellow through 1st Brown techniques"),
        technique("Original technique creation", "Create and present original self-defense techniques"),
        technique("Teaching demonstration", "Teach a class or segment demonstrating instructional ability"),
        technique("Written thesis", "Written thesis on Kenpo principles and history"),
        // Forms
        form("Long Form 7", "First black belt form"),
        form("Long Form 8", "Second black belt form"),
        // Sets — all prior sets reviewed
        set("All prior sets (review)", "Blocking Sets 1-2, Finger Sets 1-2, Coordination Sets 1-2, Stance Sets 1-2, Two-Man Set, Club Set, Knife Set"),
        // Sparring
        sparring("Black belt-level free sparring", "Full-contact controlled sparring"),
        sparring("Multiple attacker defense", "Defense against 2-3 attackers"),
        // Fitness
        fitness("Black belt fitness assessment", "Advanced physical conditioning test"),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// BJJ — Brazilian Jiu-Jitsu (IBJJF progression)
// ---------------------------------------------------------------------------

const BJJ: LibraryDiscipline = {
  discipline: "bjj",
  label: "Brazilian Jiu-Jitsu",
  belts: [
    {
      beltName: "White Belt",
      requirements: [
        classesReq(0, "No minimum for white belt"),
        technique("Basic closed guard", "Posture control and simple sweeps"),
        technique("Mount escapes", "Upa and elbow-knee escape"),
        technique("Side control escapes", "Framing and shrimping to guard"),
        technique("Basic takedowns", "Double leg, single leg, or pull guard"),
        technique("Rear mount escapes", "Defense and escape from back control"),
        sparring("Positional sparring", "Guard passing, mount retention drills"),
      ],
    },
    {
      beltName: "Blue Belt",
      requirements: [
        timeReq(24, "Minimum 2 years at White Belt"),
        classesReq(200),
        technique("Guard passing", "At least 3 passes from different guards"),
        technique("Sweeps from guard", "Scissor, hip bump, flower sweep"),
        technique("Submissions from guard", "Triangle, armbar, cross choke"),
        technique("Submissions from mount", "Armbar, cross choke, Americana"),
        technique("Back attacks", "Rear naked choke, bow and arrow"),
        technique("Half guard game", "Sweeps and passes from half guard"),
        technique("Takedown proficiency", "2-3 reliable takedowns"),
        sparring("Live rolling", "Regular sparring with controlled intensity"),
        fitness("Competition readiness", "Compete in at least 1 tournament", "adults"),
      ],
    },
    {
      beltName: "Purple Belt",
      requirements: [
        timeReq(18, "Minimum 18 months at Blue Belt"),
        classesReq(300),
        technique("Advanced guard game", "Spider, lasso, De la Riva, or X-guard"),
        technique("Leg lock entries", "Straight ankle lock, knee bar awareness"),
        technique("Advanced passing", "Pressure passing, toreando, leg drag"),
        technique("Chaining attacks", "Combine sweeps, passes, and submissions"),
        technique("Defensive BJJ", "Escapes from deep submissions"),
        sparring("Competitive sparring", "High-level rolling with all belt levels"),
      ],
    },
    {
      beltName: "Brown Belt",
      requirements: [
        timeReq(18, "Minimum 18 months at Purple Belt"),
        classesReq(400),
        technique("Complete game development", "Effective from all positions"),
        technique("Advanced leg locks", "Heel hooks, calf slicers (where allowed)"),
        technique("Teaching ability", "Can lead a class or drill session"),
        technique("Personal game refinement", "Signature techniques and sequences"),
        sparring("Mentor-level sparring", "Able to flow roll and teach while rolling"),
      ],
    },
    {
      beltName: "Black Belt",
      requirements: [
        timeReq(12, "Minimum 1 year at Brown Belt"),
        classesReq(500),
        technique("Mastery of all positions", "Comprehensive technical knowledge"),
        technique("Instructional competency", "Ability to teach fundamentals through advanced"),
        technique("Competition record", "Significant competition experience", "adults"),
        sparring("Expert-level sparring", "High-level technical rolling"),
        fitness("Demonstrated dedication", "Consistent long-term training commitment"),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// KARATE — Common Shotokan / general karate kyu requirements
// ---------------------------------------------------------------------------

const KARATE: LibraryDiscipline = {
  discipline: "karate",
  label: "Karate",
  belts: [
    {
      beltName: "White Belt (10th Kyu)",
      requirements: [
        classesReq(0, "Starting rank"),
        technique("Zenkutsu-dachi (front stance)", "Proper form and balance"),
        technique("Oi-zuki (lunge punch)", "Stepping punch with correct form"),
        technique("Gedan-barai (downward block)", "Low sweep block"),
        technique("Age-uke (rising block)", "Upper block"),
        technique("Mae-geri (front kick)", "Basic front snap kick"),
        form("Taikyoku Shodan", "First basic kata"),
      ],
    },
    {
      beltName: "Yellow Belt (9th Kyu)",
      requirements: [
        timeReq(2, "2-3 months at White Belt"),
        classesReq(24),
        technique("Kokutsu-dachi (back stance)", "Weight distribution and transitions"),
        technique("Gyaku-zuki (reverse punch)", "Reverse hip rotation punch"),
        technique("Soto-uke (outside block)", "Outside forearm block"),
        technique("Uchi-uke (inside block)", "Inside forearm block"),
        technique("Yoko-geri (side kick)", "Side snap kick"),
        form("Heian Shodan", "First Heian kata"),
        sparring("Gohon kumite", "5-step basic sparring"),
      ],
    },
    {
      beltName: "Orange Belt (8th Kyu)",
      requirements: [
        timeReq(3, "3 months at Yellow Belt"),
        classesReq(36),
        technique("Kiba-dachi (horse stance)", "Stable wide stance"),
        technique("Shuto-uke (knife-hand block)", "Open hand block"),
        technique("Mawashi-geri (roundhouse kick)", "Round kick to midsection"),
        technique("Empi-uchi (elbow strike)", "Close-range elbow strike"),
        form("Heian Nidan", "Second Heian kata"),
        sparring("Sanbon kumite", "3-step sparring"),
      ],
    },
    {
      beltName: "Green Belt (7th Kyu)",
      requirements: [
        timeReq(4, "4 months at Orange Belt"),
        classesReq(48),
        technique("Neko-ashi-dachi (cat stance)", "Light front foot stance"),
        technique("Ura-mawashi-geri (hook kick)", "Reverse roundhouse kick"),
        technique("Kizami-zuki (jab punch)", "Front-hand punch"),
        technique("Combination techniques", "3-4 technique combinations"),
        form("Heian Sandan", "Third Heian kata"),
        sparring("Kihon ippon kumite", "Basic 1-step sparring"),
      ],
    },
    {
      beltName: "Blue Belt (6th Kyu)",
      requirements: [
        timeReq(4, "4-6 months at Green Belt"),
        classesReq(60),
        technique("Ushiro-geri (back kick)", "Spinning back kick"),
        technique("Morote-uke (double block)", "Augmented forearm block"),
        technique("Advanced stances transitions", "Fluid movement between stances"),
        form("Heian Yondan", "Fourth Heian kata"),
        sparring("Jiyu ippon kumite", "Semi-free 1-step sparring"),
      ],
    },
    {
      beltName: "Purple Belt (5th Kyu)",
      requirements: [
        timeReq(4, "4-6 months at Blue Belt"),
        classesReq(72),
        technique("Tobi-geri (jumping kick)", "Jumping front or side kick"),
        technique("Ashi-barai (foot sweep)", "Low sweep technique"),
        technique("Advanced combination work", "5+ technique combinations"),
        form("Heian Godan", "Fifth Heian kata"),
        sparring("Jiyu kumite introduction", "Controlled free sparring"),
      ],
    },
    {
      beltName: "Brown Belt (3rd Kyu)",
      requirements: [
        timeReq(6, "6 months at Purple Belt"),
        classesReq(90),
        technique("All basic techniques review", "Clean execution of all fundamentals"),
        technique("Bunkai (kata application)", "Practical application of kata moves"),
        form("Tekki Shodan", "Iron horse kata"),
        sparring("Jiyu kumite", "Free sparring with control"),
        fitness("Physical conditioning", "Stamina, flexibility, and strength"),
      ],
    },
    {
      beltName: "Brown Belt (1st Kyu)",
      requirements: [
        timeReq(6, "6-12 months at 3rd Kyu"),
        classesReq(120),
        technique("Advanced bunkai", "Multi-attacker application"),
        technique("All Heian kata mastery", "All five Heian kata with power and precision"),
        form("Bassai Dai or Kanku Dai", "Advanced kata (style-dependent choice)"),
        sparring("Advanced free sparring", "High-level jiyu kumite"),
        fitness("Pre-black belt conditioning", "Endurance and mental preparation"),
      ],
    },
    {
      beltName: "Black Belt (1st Dan)",
      requirements: [
        timeReq(12, "12 months minimum at Brown Belt"),
        classesReq(150),
        technique("Complete technique review", "All kyu-level techniques demonstrated"),
        technique("Self-defense applications", "Practical self-defense scenarios"),
        form("Tokui kata", "Personal specialty kata"),
        form("All required kata review", "Demonstration of all kata from curriculum"),
        sparring("Black belt kumite", "Controlled full-speed sparring"),
        fitness("Black belt fitness test", "Push-ups, sit-ups, flexibility, endurance"),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// JUDO — Kodokan kyu progression
// ---------------------------------------------------------------------------

const JUDO: LibraryDiscipline = {
  discipline: "judo",
  label: "Judo",
  belts: [
    {
      beltName: "White Belt (6th Kyu)",
      requirements: [
        classesReq(0, "Starting rank"),
        technique("Ukemi (breakfalls)", "Forward, backward, and side falls"),
        technique("O-soto-gari (major outer reap)", "Basic throwing technique"),
        technique("O-goshi (major hip throw)", "Hip throw fundamentals"),
        technique("De-ashi-barai (advanced foot sweep)", "Foot sweep timing"),
        technique("Kesa-gatame (scarf hold)", "Basic pinning technique"),
        sparring("Randori introduction", "Light sparring with throws and pins"),
      ],
    },
    {
      beltName: "Yellow Belt (5th Kyu)",
      requirements: [
        timeReq(3, "3 months at White Belt"),
        classesReq(30),
        technique("Ippon-seoi-nage (one-arm shoulder throw)", "Shoulder throw entry and execution"),
        technique("Ko-soto-gari (small outer reap)", "Minor outer reaping throw"),
        technique("Ko-uchi-gari (small inner reap)", "Minor inner reaping throw"),
        technique("Yoko-shiho-gatame (side four-corner hold)", "Side pin technique"),
        technique("Basic turnovers", "Turning uke from turtle position"),
        form("Nage-no-kata (first 3 sets)", "First three groups of throwing forms"),
        sparring("Tachi-waza randori", "Standing randori with throws"),
      ],
    },
    {
      beltName: "Orange Belt (4th Kyu)",
      requirements: [
        timeReq(4, "4 months at Yellow Belt"),
        classesReq(50),
        technique("Tai-otoshi (body drop)", "Hand technique throw"),
        technique("Harai-goshi (sweeping hip throw)", "Hip sweep technique"),
        technique("Uchi-mata (inner thigh throw)", "Inner thigh reaping throw"),
        technique("Kami-shiho-gatame (upper four-corner hold)", "Upper body pin"),
        technique("Juji-gatame (cross armlock)", "Basic armbar from guard"),
        sparring("Ne-waza randori", "Ground grappling sparring"),
      ],
    },
    {
      beltName: "Green Belt (3rd Kyu)",
      requirements: [
        timeReq(6, "6 months at Orange Belt"),
        classesReq(80),
        technique("Tomoe-nage (circle throw)", "Sacrifice throw"),
        technique("Sode-tsurikomi-goshi (sleeve lifting hip throw)", "Sleeve grip throw"),
        technique("Combination throws (renraku-waza)", "Chaining two throws together"),
        technique("Okuri-eri-jime (sliding collar choke)", "Basic choking technique"),
        technique("Transition from throw to pin", "Seamless standing-to-ground work"),
        form("Nage-no-kata (complete)", "All five groups of throwing forms"),
        sparring("Competitive randori", "Full randori with gripping strategy"),
      ],
    },
    {
      beltName: "Brown Belt (1st Kyu)",
      requirements: [
        timeReq(9, "9-12 months at Green Belt"),
        classesReq(120),
        technique("Advanced combination throws", "3+ chained techniques"),
        technique("Counter techniques (kaeshi-waza)", "Counter-throw timing"),
        technique("Advanced ne-waza", "Chokes, armlocks, and transitions"),
        technique("Tokui-waza development", "Personal specialty technique"),
        form("Katame-no-kata", "Forms of grappling"),
        sparring("Advanced competitive randori", "Tournament-level sparring"),
        fitness("Competition experience", "Compete in at least 1 Judo tournament", "adults"),
      ],
    },
    {
      beltName: "Black Belt (1st Dan)",
      requirements: [
        timeReq(12, "12 months minimum at Brown Belt"),
        classesReq(150),
        technique("Complete Gokyo mastery", "All 40 traditional throws"),
        technique("Advanced ne-waza mastery", "Complete ground game"),
        technique("Teaching demonstration", "Ability to instruct beginners"),
        form("Nage-no-kata (examination quality)", "Formal throwing kata demonstration"),
        sparring("Dan-grade randori", "High-level competitive sparring"),
        fitness("Dan-grade fitness", "Endurance and conditioning test"),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const REQUIREMENTS_LIBRARY: LibraryDiscipline[] = [
  KENPO,
  BJJ,
  KARATE,
  JUDO,
];

/**
 * Find the best matching library discipline for a given discipline string.
 * Returns undefined if no match is found.
 */
export function findLibraryDiscipline(
  discipline: string,
): LibraryDiscipline | undefined {
  return REQUIREMENTS_LIBRARY.find((d) => d.discipline === discipline);
}

/**
 * Find the best matching belt within a discipline by fuzzy name matching.
 * Tries exact match first, then case-insensitive includes, then word overlap.
 */
export function findLibraryBelt(
  libraryDiscipline: LibraryDiscipline,
  beltName: string,
): LibraryBelt | undefined {
  const belts = libraryDiscipline.belts;
  const lower = beltName.toLowerCase();

  // 1. Exact match
  const exact = belts.find((b) => b.beltName === beltName);
  if (exact) return exact;

  // 2. Case-insensitive exact match
  const ciExact = belts.find((b) => b.beltName.toLowerCase() === lower);
  if (ciExact) return ciExact;

  // 3. One contains the other
  const contains = belts.find(
    (b) =>
      b.beltName.toLowerCase().includes(lower) ||
      lower.includes(b.beltName.toLowerCase()),
  );
  if (contains) return contains;

  // 4. Word overlap scoring
  const inputWords = lower.split(/[\s()\/]+/).filter(Boolean);
  let best: LibraryBelt | undefined;
  let bestScore = 0;
  for (const belt of belts) {
    const beltWords = belt.beltName.toLowerCase().split(/[\s()\/]+/).filter(Boolean);
    let score = 0;
    for (const w of inputWords) {
      if (beltWords.some((bw) => bw.includes(w) || w.includes(bw))) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = belt;
    }
  }
  return bestScore >= 1 ? best : undefined;
}

/**
 * Get all unique categories from a list of requirements, in a stable display
 * order.
 */
export function getCategories(requirements: LibraryRequirement[]): string[] {
  const order = ["techniques", "forms", "sets", "sparring", "time", "fitness"];
  const seen = new Set<string>();
  for (const r of requirements) {
    seen.add(r.category);
  }
  return order.filter((c) => seen.has(c));
}

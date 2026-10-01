export interface MasteryQuestion {
  id: number;
  prompt: string;
  imageSrc?: string;
  visualEmoji?: string;
  subText?: string;
  options: { id: string; text: string; emoji: string }[];
  correctAnswer: string;
}

export const MASTERY_QUESTIONS_BY_DOMAIN: Record<string, MasteryQuestion[]> = {
  // 1. Communication
  communication: [
    {
      id: 1,
      prompt: "Where are the mother and child?",
      imageSrc: "/images/mastery/communication/q1.png",
      visualEmoji: "🍳 🏠",
      subText: "Where are we going today, mom?",
      options: [
        { id: "a", text: "Kitchen", emoji: "🍽️" },
        { id: "b", text: "School", emoji: "🏫" },
        { id: "c", text: "Park", emoji: "🌳" },
      ],
      correctAnswer: "a",
    },
    {
      id: 2,
      prompt: "What are the mother and child doing?",
      imageSrc: "/images/mastery/communication/q2.png",
      visualEmoji: "🧁 🥪",
      subText: "Ha ha! You are so funny, my boy!",
      options: [
        { id: "a", text: "Eating", emoji: "😋" },
        { id: "b", text: "Sleeping", emoji: "😴" },
        { id: "c", text: "Shopping", emoji: "🛒" },
      ],
      correctAnswer: "a",
    },
    {
      id: 3,
      prompt: "Where are the people shopping for food?",
      imageSrc: "/images/mastery/communication/q3.png",
      visualEmoji: "🛒 🥫",
      subText: "Take my hand so you won't get lost ok?",
      options: [
        { id: "a", text: "Supermarket", emoji: "🏬" },
        { id: "b", text: "Classroom", emoji: "📚" },
        { id: "c", text: "Bedroom", emoji: "🛏️" },
      ],
      correctAnswer: "a",
    },
    {
      id: 4,
      prompt: "What can you see in the child's room?",
      imageSrc: "/images/mastery/communication/q4.png",
      visualEmoji: "🧸 🎲",
      subText: "Maybe this one.",
      options: [
        { id: "a", text: "Toys", emoji: "🧸" },
        { id: "b", text: "Buses", emoji: "🚌" },
        { id: "c", text: "Lockers", emoji: "🗄️" },
      ],
      correctAnswer: "a",
    },
    {
      id: 5,
      prompt: "Who is standing in front of the classroom?",
      imageSrc: "/images/mastery/communication/q5.png",
      visualEmoji: "🧑‍🏫 📋",
      options: [
        { id: "a", text: "Teacher", emoji: "👩‍🏫" },
        { id: "b", text: "Doctor", emoji: "🩺" },
        { id: "c", text: "Shopkeeper", emoji: "🛍️" },
      ],
      correctAnswer: "a",
    },
  ],

  // 2. Functional Literacy & Numeracy
  literacy_numeracy: [
    {
      id: 1,
      prompt: "Which letter is shown here?",
      imageSrc: "/images/mastery/literacy_numeracy/q1.png",
      visualEmoji: "🐶 D d",
      options: [
        { id: "a", text: "Letter T", emoji: "🇹" },
        { id: "b", text: "Letter D", emoji: "🇩" },
        { id: "c", text: "Letter C", emoji: "🇨" },
      ],
      correctAnswer: "b",
    },
    {
      id: 2,
      prompt: "Which month comes after April?",
      imageSrc: "/images/mastery/literacy_numeracy/q2.png",
      visualEmoji: "🗓️ April ➡️ ?",
      subText: "April May June",
      options: [
        { id: "a", text: "January", emoji: "❄️" },
        { id: "b", text: "May", emoji: "🌸" },
        { id: "c", text: "December", emoji: "⛄" },
      ],
      correctAnswer: "b",
    },
    {
      id: 3,
      prompt: "What letter is being traced on the chalkboard?",
      imageSrc: "/images/mastery/literacy_numeracy/q3.png",
      visualEmoji: "✍️ 🟢 S",
      options: [
        { id: "a", text: "Letter S", emoji: "🇸" },
        { id: "b", text: "Letter B", emoji: "🇧" },
        { id: "c", text: "Letter Z", emoji: "🇿" },
      ],
      correctAnswer: "a",
    },
    {
      id: 4,
      prompt: "How many green leaves can you count?",
      imageSrc: "/images/mastery/literacy_numeracy/q4.png",
      visualEmoji: "🍃 🍃 🍃 🍃",
      subText: "Four Leaves",
      options: [
        { id: "a", text: "4 Leaves", emoji: "4️⃣" },
        { id: "b", text: "5 Leaves", emoji: "5️⃣" },
        { id: "c", text: "8 Leaves", emoji: "8️⃣" },
      ],
      correctAnswer: "a",
    },
    {
      id: 5,
      prompt: "What means of transport is this?",
      imageSrc: "/images/mastery/literacy_numeracy/q5.png",
      visualEmoji: "🚂 🛤️",
      subText: "TRAIN",
      options: [
        { id: "a", text: "Train", emoji: "🚆" },
        { id: "b", text: "Boat", emoji: "⛵" },
        { id: "c", text: "Aeroplane", emoji: "✈️" },
      ],
      correctAnswer: "a",
    },
  ],

  // 3. Daily Living & Personal Care
  daily_living: [
    {
      id: 1,
      prompt: "What is the boy doing in the garden?",
      imageSrc: "/images/mastery/daily_living/q1.png",
      visualEmoji: "🪴 🚿",
      subText: "It's time to water the plants.",
      options: [
        { id: "a", text: "Watering plants", emoji: "🌱" },
        { id: "b", text: "Cooking food", emoji: "🍳" },
        { id: "c", text: "Cleaning shoes", emoji: "👟" },
      ],
      correctAnswer: "a",
    },
    {
      id: 2,
      prompt: "Which item can we use to brush our teeth?",
      imageSrc: "/images/mastery/daily_living/q2.png",
      visualEmoji: "🪥 🧼 🧴",
      options: [
        { id: "a", text: "Toothbrush", emoji: "🪥" },
        { id: "b", text: "Comb", emoji: "🪮" },
        { id: "c", text: "Soap", emoji: "🧼" },
      ],
      correctAnswer: "a",
    },
    {
      id: 3,
      prompt: "What is the child doing at the sink?",
      imageSrc: "/images/mastery/daily_living/q3.png",
      visualEmoji: "🚰 🫧",
      options: [
        { id: "a", text: "Washing hands", emoji: "🧼" },
        { id: "b", text: "Eating lunch", emoji: "🥪" },
        { id: "c", text: "Sleeping", emoji: "😴" },
      ],
      correctAnswer: "a",
    },
    {
      id: 4,
      prompt: "Where should we put recyclable waste?",
      imageSrc: "/images/mastery/daily_living/q4.png",
      visualEmoji: "♻️ 🗑️",
      subText: "Recycle",
      options: [
        { id: "a", text: "Recycle bin", emoji: "♻️" },
        { id: "b", text: "Bed", emoji: "🛏️" },
        { id: "c", text: "School bag", emoji: "🎒" },
      ],
      correctAnswer: "a",
    },
    {
      id: 5,
      prompt: "Which item can be put in the green recycle bin?",
      imageSrc: "/images/mastery/daily_living/q5.png",
      visualEmoji: "🍾 🟢",
      options: [
        { id: "a", text: "Glass bottle", emoji: "🍾" },
        { id: "b", text: "Pillow", emoji: "🛌" },
        { id: "c", text: "Shoe", emoji: "👟" },
      ],
      correctAnswer: "a",
    },
  ],

  // 4. Money & Shopping
  money_shopping: [
    {
      id: 1,
      prompt: "What is shown in the picture?",
      imageSrc: "/images/mastery/money_shopping/q1.png",
      visualEmoji: "🥛 📦",
      subText: "Milk",
      options: [
        { id: "a", text: "Milk", emoji: "🥛" },
        { id: "b", text: "Juice", emoji: "🧃" },
        { id: "c", text: "Bread", emoji: "🍞" },
      ],
      correctAnswer: "a",
    },
    {
      id: 2,
      prompt: "What food is shown in the picture?",
      imageSrc: "/images/mastery/money_shopping/q2.png",
      visualEmoji: "🍫",
      options: [
        { id: "a", text: "Chocolate", emoji: "🍫" },
        { id: "b", text: "Rice", emoji: "🍚" },
        { id: "c", text: "Apple", emoji: "🍎" },
      ],
      correctAnswer: "a",
    },
    {
      id: 3,
      prompt: "What fresh vegetable is shown in the picture?",
      imageSrc: "/images/mastery/money_shopping/q3.png",
      visualEmoji: "🥬 🥗",
      subText: "Spinach",
      options: [
        { id: "a", text: "Spinach", emoji: "🥬" },
        { id: "b", text: "Cucumber", emoji: "🥒" },
        { id: "c", text: "Corn", emoji: "🌽" },
      ],
      correctAnswer: "a",
    },
    {
      id: 4,
      prompt: "What is the value of this currency note?",
      imageSrc: "/images/mastery/money_shopping/q4.png",
      visualEmoji: "💵 ₹10",
      subText: "भारतीय रिझर्व्ह बँक - 10 रुपये",
      options: [
        { id: "a", text: "₹10 Note", emoji: "🔟" },
        { id: "b", text: "₹20 Note", emoji: "2️⃣" },
        { id: "c", text: "₹100 Note", emoji: "💯" },
      ],
      correctAnswer: "a",
    },
    {
      id: 5,
      prompt: "Which Indian coin is worth 1 Rupee?",
      imageSrc: "/images/mastery/money_shopping/q5.png",
      visualEmoji: "🪙 ₹1",
      options: [
        { id: "a", text: "The ₹1 coin", emoji: "1️⃣" },
        { id: "b", text: "The ₹10 coin", emoji: "🔟" },
        { id: "c", text: "The ₹20 coin", emoji: "2️⃣" },
      ],
      correctAnswer: "a",
    },
  ],

  // 5. Safety & Emergency
  safety_emergency: [
    {
      id: 1,
      prompt: "Who helps people safely during a fire emergency?",
      imageSrc: "/images/mastery/safety_emergency/q1.png",
      visualEmoji: "🚒 🧑‍🚒",
      subText: "Fire Fighter",
      options: [
        { id: "a", text: "Firefighter", emoji: "🧑‍🚒" },
        { id: "b", text: "Teacher", emoji: "👩‍🏫" },
        { id: "c", text: "Chef", emoji: "👨‍🍳" },
      ],
      correctAnswer: "a",
    },
    {
      id: 2,
      prompt: "The child swallowed a toy. What problem is she having?",
      imageSrc: "/images/mastery/safety_emergency/q2.png",
      visualEmoji: "⚠️ 🫁",
      subText: "First Aid emergency",
      options: [
        { id: "a", text: "Choking", emoji: "😮" },
        { id: "b", text: "Sleeping", emoji: "😴" },
        { id: "c", text: "Swimming", emoji: "🏊" },
      ],
      correctAnswer: "a",
    },
    {
      id: 3,
      prompt: "What does this road sign with a bicycle slash mean?",
      imageSrc: "/images/mastery/safety_emergency/q3.png",
      visualEmoji: "🚫 🚲",
      options: [
        { id: "a", text: "No bicycles", emoji: "🚳" },
        { id: "b", text: "Turn left", emoji: "⬅️" },
        { id: "c", text: "One way", emoji: "⬆️" },
      ],
      correctAnswer: "a",
    },
    {
      id: 4,
      prompt: "What should a child do when approached by a stranger?",
      imageSrc: "/images/mastery/safety_emergency/q4.png",
      visualEmoji: "🛑 👤",
      subText: "Do not speak to strangers. They can harm you.",
      options: [
        { id: "a", text: "Do not talk to the stranger", emoji: "🙅‍♂️" },
        { id: "b", text: "Go with the stranger", emoji: "🚶" },
        { id: "c", text: "Give the stranger your toys", emoji: "🧸" },
      ],
      correctAnswer: "a",
    },
    {
      id: 5,
      prompt: "What should we keep at home for first-aid emergencies?",
      imageSrc: "/images/mastery/safety_emergency/q5.png",
      visualEmoji: "🩹 🧰",
      subText: "We must keep a first aid box at home.",
      options: [
        { id: "a", text: "First aid box", emoji: "🩺" },
        { id: "b", text: "Television", emoji: "📺" },
        { id: "c", text: "Toy box", emoji: "🧸" },
      ],
      correctAnswer: "a",
    },
  ],

  // 6. Social & Emotional Skills
  social_emotional: [
    {
      id: 1,
      prompt: "When I meet a new friend at school, how do I feel?",
      imageSrc: "/images/mastery/social_emotional/q1.png",
      visualEmoji: "👦 🤝 👧",
      subText: "When I meet a new friend.",
      options: [
        { id: "a", text: "Happy", emoji: "😄" },
        { id: "b", text: "Sad", emoji: "😢" },
        { id: "c", text: "Angry", emoji: "😡" },
      ],
      correctAnswer: "a",
    },
    {
      id: 2,
      prompt: "What is the boy doing when he needs help with assembling?",
      imageSrc: "/images/mastery/social_emotional/q2.png",
      visualEmoji: "🔧 📦",
      options: [
        { id: "a", text: "Asking for help", emoji: "🙋‍♂️" },
        { id: "b", text: "Sleeping", emoji: "😴" },
        { id: "c", text: "Playing football", emoji: "⚽" },
      ],
      correctAnswer: "a",
    },
    {
      id: 3,
      prompt: "Is it okay to ask a trusted adult for help when feeling overwhelmed?",
      imageSrc: "/images/mastery/social_emotional/q3.png",
      visualEmoji: "✋ 💛",
      options: [
        { id: "a", text: "Yes, it is okay", emoji: "✅" },
        { id: "b", text: "No", emoji: "❌" },
        { id: "c", text: "Never", emoji: "🚫" },
      ],
      correctAnswer: "a",
    },
    {
      id: 4,
      prompt: "What are the children doing at the playground monkey bars?",
      imageSrc: "/images/mastery/social_emotional/q4.png",
      visualEmoji: "🤸 🪜",
      options: [
        { id: "a", text: "Taking turns", emoji: "🔄" },
        { id: "b", text: "Sleeping", emoji: "😴" },
        { id: "c", text: "Running away", emoji: "🏃" },
      ],
      correctAnswer: "a",
    },
    {
      id: 5,
      prompt: "What should we do with our toys when playing with peers?",
      imageSrc: "/images/mastery/social_emotional/q5.png",
      visualEmoji: "🧩 🤝",
      options: [
        { id: "a", text: "Share them", emoji: "🎁" },
        { id: "b", text: "Hide them", emoji: "🙈" },
        { id: "c", text: "Break them", emoji: "🔨" },
      ],
      correctAnswer: "a",
    },
  ],

  // 7. Community Places & Problem Solving
  community_problem_solving: [
    {
      id: 1,
      prompt: "Where can we go to buy fresh food and groceries?",
      imageSrc: "/images/mastery/community_problem_solving/q1.png",
      visualEmoji: "🏬 🛒",
      subText: "GROCERY • FRESH FOOD",
      options: [
        { id: "a", text: "Supermarket / Grocery", emoji: "🏬" },
        { id: "b", text: "Hospital", emoji: "🏥" },
        { id: "c", text: "Police station", emoji: "🚓" },
      ],
      correctAnswer: "a",
    },
    {
      id: 2,
      prompt: "Where do children sit together to read story books?",
      imageSrc: "/images/mastery/community_problem_solving/q2.png",
      visualEmoji: "📚 📖",
      subText: "The Library Story Room",
      options: [
        { id: "a", text: "Library", emoji: "🏛️" },
        { id: "b", text: "Train Station", emoji: "🚉" },
        { id: "c", text: "Swimming Pool", emoji: "🏊" },
      ],
      correctAnswer: "a",
    },
    {
      id: 3,
      prompt: "What natural object in the sky helps us know the direction?",
      imageSrc: "/images/mastery/community_problem_solving/q3.png",
      visualEmoji: "☀️ 🧭",
      subText: "Cardinal directions: North, South, East, West",
      options: [
        { id: "a", text: "Sun", emoji: "☀️" },
        { id: "b", text: "Spoon", emoji: "🥄" },
        { id: "c", text: "Book", emoji: "📖" },
      ],
      correctAnswer: "a",
    },
    {
      id: 4,
      prompt: "What handheld navigation tool points North and finds directions?",
      imageSrc: "/images/mastery/community_problem_solving/q4.png",
      visualEmoji: "🧭 🧭",
      subText: "Directions using a Compass",
      options: [
        { id: "a", text: "Compass", emoji: "🧭" },
        { id: "b", text: "Cup", emoji: "☕" },
        { id: "c", text: "Clock", emoji: "⏰" },
      ],
      correctAnswer: "a",
    },
    {
      id: 5,
      prompt: "What should we do when someone is speaking to the group?",
      imageSrc: "/images/mastery/community_problem_solving/q5.png",
      visualEmoji: "👂 🤝",
      options: [
        { id: "a", text: "Listen politely", emoji: "👂" },
        { id: "b", text: "Make loud noise", emoji: "📢" },
        { id: "c", text: "Run outside", emoji: "🏃" },
      ],
      correctAnswer: "a",
    },
  ],

  // 8. Vocational & Work Readiness
  vocational_readiness: [
    {
      id: 1,
      prompt: "What should a student do when the instructor gives directions?",
      imageSrc: "/images/mastery/vocational_readiness/q1.png",
      visualEmoji: "👂 📋",
      subText: "Whole Body Listening: Lips together, ears listening.",
      options: [
        { id: "a", text: "Listen carefully", emoji: "👂" },
        { id: "b", text: "Sleep", emoji: "😴" },
        { id: "c", text: "Run away", emoji: "🏃" },
      ],
      correctAnswer: "a",
    },
    {
      id: 2,
      prompt: "Where are the students seated with their desks?",
      imageSrc: "/images/mastery/vocational_readiness/q2.png",
      visualEmoji: "🏫 🎒",
      options: [
        { id: "a", text: "Classroom", emoji: "🏫" },
        { id: "b", text: "Park", emoji: "🌳" },
        { id: "c", text: "Supermarket", emoji: "🛒" },
      ],
      correctAnswer: "a",
    },
    {
      id: 3,
      prompt: "What are the two classmates doing politely at school?",
      imageSrc: "/images/mastery/vocational_readiness/q3.png",
      visualEmoji: "💬 🧑‍🤝‍🧑",
      subText: "My favorite subject is science.",
      options: [
        { id: "a", text: "Talking and sharing", emoji: "🗣️" },
        { id: "b", text: "Sleeping", emoji: "😴" },
        { id: "c", text: "Swimming", emoji: "🏊" },
      ],
      correctAnswer: "a",
    },
    {
      id: 4,
      prompt: "What should you do before leaving your workstation?",
      imageSrc: "/images/mastery/vocational_readiness/q4.png",
      visualEmoji: "🧹 🗄️",
      options: [
        { id: "a", text: "Clean and pack supplies", emoji: "🧰" },
        { id: "b", text: "Leave items on floor", emoji: "❌" },
        { id: "c", text: "Throw supplies away", emoji: "🗑️" },
      ],
      correctAnswer: "a",
    },
    {
      id: 5,
      prompt: "When you finish a work task, what is the best next step?",
      imageSrc: "/images/mastery/vocational_readiness/q5.png",
      visualEmoji: "✅ 📋",
      options: [
        { id: "a", text: "Check your work and notify teacher", emoji: "🙋‍♂️" },
        { id: "b", text: "Run out of the room", emoji: "🚪" },
        { id: "c", text: "Hide the task", emoji: "🙈" },
      ],
      correctAnswer: "a",
    },
  ],
};

export const MOTIVATIONAL_QUOTES = [
    // Elon Musk
    "When something is important enough, you do it even if the odds are not in your favor. — Elon Musk",
    "If you get up in the morning and think the future is going to be better, it is a bright day. — Elon Musk",
    "Some people don't like change, but you need to embrace change if the alternative is disaster. — Elon Musk",
    "Persistence is very important. You should not give up unless you are forced to give up. — Elon Musk",
    "It is possible for ordinary people to choose to be extraordinary. — Elon Musk",
    "Failure is an option here. If things are not failing, you are not innovating enough. — Elon Musk",
    "Life is too short for long-term grudges. — Elon Musk",
    "Take risks now and do something bold. You won't regret it. — Elon Musk",
    "Constantly think about how you could be doing things better and questioning yourself. — Elon Musk",
    "Great companies are built on great products. — Elon Musk",

    // Naval Ravikant
    "Impatience with actions, patience with results. — Naval Ravikant",
    "The closer you are to the truth, the more silent you become inside. — Naval Ravikant",
    "Desire is a contract that you make with yourself to be unhappy until you get what you want. — Naval Ravikant",
    "Play iterated games. All the returns in life, whether in wealth, relationships, or knowledge, come from compound interest. — Naval Ravikant",
    "Read what you love until you love to read. — Naval Ravikant",
    "The genuine love for reading itself, when cultivated, is a superpower. — Naval Ravikant",
    "Specific knowledge is found by pursuing your genuine curiosity and passion rather than whatever is hot right now. — Naval Ravikant",
    "If you can't see yourself working with someone for life, don't work with them for a day. — Naval Ravikant",
    "A fit body, a calm mind, a house full of love. These things cannot be bought – they must be earned. — Naval Ravikant",
    "Learn to sell. Learn to build. If you can do both, you will be unstoppable. — Naval Ravikant",

    // Swami Vivekananda
    "Arise, awake, and stop not till the goal is reached. — Swami Vivekananda",
    "Take up one idea. Make that one idea your life. — Swami Vivekananda",
    "Truth can be stated in a thousand different ways, yet each one can be true. — Swami Vivekananda",
    "In a day, when you don't come across any problems - you can be sure that you are traveling in a wrong path. — Swami Vivekananda",
    "You have to grow from the inside out. None can teach you, none can make you spiritual. There is no other teacher but your own soul. — Swami Vivekananda",
    "We are what our thoughts have made us; so take care about what you think. Words are secondary. Thoughts live; they travel far. — Swami Vivekananda",
    "The greatest religion is to be true to your own nature. Have faith in yourselves. — Swami Vivekananda",
    "Anything that makes you weak, physically, intellectually, and spiritually, reject as poison. — Swami Vivekananda",
    "Talk to yourself once in a day, otherwise you may miss meeting an excellent person in this world. — Swami Vivekananda",
    "All power is within you; you can do anything and everything. Believe in that. — Swami Vivekananda",

    // Bhagavad Gita
    "You have the right to work, but never to the fruit of work. — Bhagavad Gita",
    "A person can rise through the efforts of his own mind. — Bhagavad Gita",
    "It is better to live your own destiny imperfectly than to live an imitation of somebody else's life with perfection. — Bhagavad Gita",
    "No one who does good work will ever come to a bad end, either here or in the world to come. — Bhagavad Gita",
    "There is nothing lost or wasted in this life. — Bhagavad Gita",
    "When meditation is mastered, the mind is unwavering like the flame of a lamp in a windless place. — Bhagavad Gita",
    "We are kept from our goal not by obstacles, but by a clear path to a lesser goal. — Bhagavad Gita",
    "The mind acts like an enemy for those who do not control it. — Bhagavad Gita",
    "Set thy heart upon thy work, but never on its reward. — Bhagavad Gita",
    "Through selfless service, you will always be fruitful and find the fulfillment of your desires. — Bhagavad Gita",

    // General
    "The Zeigarnik effect: You remember uncompleted tasks better. Finish this one.",
    "Action precedes motivation. Start now, and the drive will follow."
];

export function getRandomQuote() {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[idx];
}

/**
 * Returns a motivational quote that stays the same for a given interval.
 * @param {number} intervalHours - The interval in hours (default 8).
 * @returns {string}
 */
export function getTimedQuote(intervalHours = 8) {
    const msPerInterval = intervalHours * 60 * 60 * 1000;
    const periodIndex = Math.floor(Date.now() / msPerInterval);
    
    // Simple LCG-like pseudo-random selection based on the period index
    // to ensure the quote is "random" but consistent for everyone in the same time block.
    // seed = periodIndex
    let seed = periodIndex;
    const nextRandom = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
    
    const idx = Math.floor(nextRandom() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[idx];
}

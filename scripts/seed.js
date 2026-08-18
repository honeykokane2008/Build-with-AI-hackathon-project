const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const regions = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "regions.json"), "utf-8"));

const SAMPLES = [
  // [regionId, category, urgency, language, text]
  ["yavatmal", "water", "critical", "mr", "आमच्या गावात गेल्या तीन आठवड्यांपासून पाणी पुरवठा बंद आहे. महिलांना लांबून पाणी आणावे लागते."],
  ["yavatmal", "water", "high", "en", "No piped water supply in our ward for over two weeks. Borewell also dried up."],
  ["yavatmal", "healthcare", "critical", "hi", "गांव के प्राथमिक स्वास्थ्य केंद्र में डॉक्टर पिछले एक महीने से नहीं आ रहे हैं।"],
  ["yavatmal", "healthcare", "high", "en", "PHC has no doctor available most days, patients are being sent 40km away."],
  ["yavatmal", "roads", "medium", "en", "Main road to the market has large potholes, becomes unusable during rain."],
  ["yavatmal", "sanitation", "high", "mr", "गावात कचरा उचलला जात नाही, रस्त्यावर कचऱ्याचे ढीग साचले आहेत."],
  ["buldhana", "water", "critical", "en", "Entire village has had no water supply for a month, tanker has stopped coming."],
  ["buldhana", "water", "high", "hi", "पानी की पाइपलाइन टूटी हुई है, तीन हफ्तों से मरम्मत नहीं हुई।"],
  ["buldhana", "healthcare", "critical", "en", "No ambulance service in our block, a pregnant woman had to be taken on a bike last week."],
  ["buldhana", "healthcare", "high", "mr", "दवाखान्यात औषधांचा तुटवडा आहे, गरीब रुग्णांना बाहेरून औषध विकत घ्यावी लागतात."],
  ["buldhana", "sanitation", "critical", "en", "Open drain overflowing near the school for over a month, children are falling sick."],
  ["buldhana", "roads", "high", "hi", "गांव को जोड़ने वाली सड़क बारिश में पूरी तरह टूट जाती है, स्कूल बस नहीं आ पाती।"],
  ["buldhana", "electricity", "medium", "en", "Frequent power cuts lasting 6-8 hours daily, affecting irrigation pumps."],
  ["wardha", "water", "high", "en", "Water supply comes only once every three days, insufficient for the whole village."],
  ["wardha", "healthcare", "medium", "mr", "आरोग्य केंद्रात फक्त एक परिचारिका आहे, गर्दी हाताळणे कठीण होते."],
  ["wardha", "roads", "high", "en", "Bridge connecting two villages has a large crack, feels unsafe to cross."],
  ["wardha", "sanitation", "medium", "hi", "सार्वजनिक शौचालय की सफाई नहीं होती, बहुत गंदगी है।"],
  ["amravati", "roads", "high", "en", "Potholes on the main city road near the bus stand causing accidents."],
  ["amravati", "water", "medium", "mr", "पाण्याचा दाब खूप कमी आहे, वरच्या मजल्यावर पाणी पोहोचत नाही."],
  ["amravati", "healthcare", "medium", "en", "Long waiting times at the district hospital, sometimes 4+ hours for a checkup."],
  ["amravati", "electricity", "high", "hi", "ट्रांसफार्मर जल गया है, पूरे इलाके में एक हफ्ते से बिजली नहीं है।"],
  ["amravati", "sanitation", "low", "en", "Garbage truck skips our lane sometimes, not a major issue but happens often."],
  ["akola", "water", "medium", "en", "Water quality seems poor, several people reported stomach issues after drinking."],
  ["akola", "roads", "medium", "mr", "रस्त्यावर खड्डे आहेत, दुचाकीस्वारांना त्रास होतो."],
  ["akola", "healthcare", "high", "en", "No pediatrician available at the PHC, infants have to be taken to the city."],
  ["akola", "electricity", "low", "hi", "कभी-कभी वोल्टेज कम होता है, पंखे ठीक से नहीं चलते।"],
  ["nagpur", "roads", "low", "en", "Minor pothole near the residential colony, not urgent but should be fixed."],
  ["nagpur", "water", "low", "en", "Water supply timing changed without notice, minor inconvenience."],
  ["nagpur", "sanitation", "medium", "mr", "काही भागात कचरा वेळेवर उचलला जात नाही."],
  ["nagpur", "healthcare", "low", "en", "Hospital appointment system could be improved, otherwise services are fine."],
];

function makeComplaint([regionId, category, urgency, language, text], i) {
  const daysAgo = Math.floor(Math.random() * 21);
  const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    id: crypto.randomUUID(),
    text,
    channel: ["whatsapp", "text", "voice", "walk-in"][i % 4],
    category,
    urgency,
    language,
    translatedText: language === "en" ? text : "(auto-translation placeholder — connect ANTHROPIC_API_KEY for live translation)",
    confidence: "seed-data",
    regionId,
    createdAt,
  };
}

const complaints = SAMPLES.map(makeComplaint);
complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

fs.writeFileSync(
  path.join(__dirname, "..", "data", "complaints.json"),
  JSON.stringify(complaints, null, 2),
  "utf-8"
);

console.log(`Seeded ${complaints.length} complaints across ${regions.length} districts.`);

const ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", 
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", 
  "seventeen", "eighteen", "nineteen"
];

const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
];

const SCALES = ["", "thousand", "million", "billion"];

function helper(n) {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return TENS[ten] + (unit ? "-" + ONES[unit] : "");
  }
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  return ONES[hundred] + " hundred" + (remainder ? " " + helper(remainder) : "");
}

export function numberToWords(num) {
  if (num === 0) return "Zero";
  if (num === 1000000000) return "One Billion";
  
  let words = [];
  let scaleIndex = 0;
  let temp = num;
  
  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk !== 0) {
      const chunkWords = helper(chunk);
      words.unshift(chunkWords + (SCALES[scaleIndex] ? " " + SCALES[scaleIndex] : ""));
    }
    temp = Math.floor(temp / 1000);
    scaleIndex++;
  }
  
  // Format the resulting string with Title Case
  const joinedWords = words.join(", ").trim();
  return joinedWords
    .split(" ")
    .map(word => {
      if (word.includes("-")) {
        return word.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

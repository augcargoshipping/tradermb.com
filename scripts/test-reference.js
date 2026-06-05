// Test script to demonstrate the new reference code generation
function generateReferenceCode(fullName) {
  // Extract initials from full name
  const nameParts = fullName.trim().split(/\s+/)
  const initials = nameParts
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 5) // Limit to 5 initials max to keep it reasonable
  
  // Generate 3 random digits
  const randomDigits = Math.floor(100 + Math.random() * 900).toString()
  
  return `${initials}${randomDigits}`
}

console.log('🧪 Testing New Reference Code Generation...\n');

// Test cases with different name formats
const testNames = [
  "John Doe",
  "Mary Jane Smith",
  "Okechukwu Valentine Omeje",
  "A B C D E F", // Test with many initials
  "SingleName",
  "John van der Berg", // Test with multiple words
  "Li Wei Chen"
];

console.log('📝 Reference Code Examples:');
console.log('========================');

testNames.forEach(name => {
  const reference = generateReferenceCode(name);
  console.log(`${name.padEnd(25)} → ${reference}`);
});

console.log('\n✨ New Format: Full Name Initials + 3 Random Digits');
console.log('Example: "John Doe" → "JD123"');
console.log('Example: "Mary Jane Smith" → "MJS456"');
console.log('Example: "Okechukwu Valentine Omeje" → "OVO789"'); 
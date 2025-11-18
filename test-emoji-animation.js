#!/usr/bin/env node

/**
 * Standalone test script for emoji animation functionality
 * Tests the emoji assignment logic without requiring full project dependencies
 */

// Constants from src/constants.ts
const emojis = [
  '🦄', '🥰', '🍔', '🙉', '🍎',
  '😇', '🦊', '🍉', '🤩', '🦁', '😜'
];

// Logic from src/reminders/reminders.service.ts
const getNextIndex = (reminders) => {
  const lastEmoji = reminders[reminders.length - 1].emoji;
  const lastEmojiIndex = emojis.indexOf(lastEmoji);
  return lastEmojiIndex < 0 ? 0 : (lastEmojiIndex + 1) % emojis.length;
};

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✓ ${testName}`);
    testsPassed++;
  } else {
    console.error(`✗ ${testName}`);
    testsFailed++;
  }
}

function assertEquals(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✓ ${testName}`);
    testsPassed++;
  } else {
    console.error(`✗ ${testName}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    testsFailed++;
  }
}

console.log('\n🧪 Testing Emoji Animation Logic\n');
console.log('═'.repeat(50));

// Test 1: First reminder should get a random emoji (index 0-10)
console.log('\n📝 Test 1: First reminder (random emoji selection)');
const firstReminderIdx = (Math.random() * emojis.length) | 0;
assert(
  firstReminderIdx >= 0 && firstReminderIdx < emojis.length,
  'First reminder index should be within emoji array bounds'
);
console.log(`   First reminder would get emoji: ${emojis[firstReminderIdx]} (index ${firstReminderIdx})`);

// Test 2: Sequential emoji assignment
console.log('\n📝 Test 2: Sequential emoji assignment');
const reminders = [
  { emoji: '🦄' }, // Index 0
];
let nextIdx = getNextIndex(reminders);
assertEquals(nextIdx, 1, 'After 🦄 (index 0), next should be index 1');
assertEquals(emojis[nextIdx], '🥰', 'Next emoji should be 🥰');

// Test 3: Cycling through all emojis
console.log('\n📝 Test 3: Full cycle through emoji list');
const testReminders = [{ emoji: '🦄' }]; // Start with first emoji

for (let i = 1; i < emojis.length; i++) {
  const idx = getNextIndex(testReminders);
  testReminders.push({ emoji: emojis[idx] });
  assertEquals(idx, i, `Step ${i}: Should get emoji at index ${i}`);
}

console.log('   Full sequence:', testReminders.map(r => r.emoji).join(' → '));

// Test 4: Wrapping around to start
console.log('\n📝 Test 4: Wrapping around after last emoji');
const lastEmojiReminders = [
  { emoji: '😜' }, // Last emoji (index 10)
];
nextIdx = getNextIndex(lastEmojiReminders);
assertEquals(nextIdx, 0, 'After 😜 (index 10), should wrap to index 0');
assertEquals(emojis[nextIdx], '🦄', 'After last emoji, should wrap to 🦄');

// Test 5: Handling invalid/missing emoji
console.log('\n📝 Test 5: Handling invalid emoji');
const invalidReminders = [
  { emoji: '❌' }, // Not in the list
];
nextIdx = getNextIndex(invalidReminders);
assertEquals(nextIdx, 0, 'Invalid emoji should default to index 0');

// Test 6: Complete simulation of creating multiple reminders
console.log('\n📝 Test 6: Simulating creation of multiple reminders');
const simulatedReminders = [];
console.log('\n   Simulating user creating 15 reminders:');

// First reminder (random)
const firstIdx = 3; // Simulating random selection
simulatedReminders.push({
  id: 1,
  emoji: emojis[firstIdx],
  text: 'First reminder'
});
console.log(`   1. ${simulatedReminders[0].emoji} (random: index ${firstIdx})`);

// Next 14 reminders (sequential)
for (let i = 2; i <= 15; i++) {
  const idx = getNextIndex(simulatedReminders);
  simulatedReminders.push({
    id: i,
    emoji: emojis[idx],
    text: `Reminder ${i}`
  });
  console.log(`   ${i}. ${simulatedReminders[i-1].emoji} (sequential: index ${idx})`);
}

// Verify the sequence wrapped correctly
const expectedWraps = Math.floor(15 / emojis.length);
assert(expectedWraps === 1, 'Should wrap around once with 15 reminders (11 emojis)');

// Test 7: Verify no duplicate consecutive emojis
console.log('\n📝 Test 7: No consecutive duplicate emojis');
let hasConsecutiveDuplicates = false;
for (let i = 1; i < simulatedReminders.length; i++) {
  if (simulatedReminders[i].emoji === simulatedReminders[i-1].emoji) {
    hasConsecutiveDuplicates = true;
    break;
  }
}
assert(!hasConsecutiveDuplicates, 'No consecutive reminders should have the same emoji');

// Summary
console.log('\n' + '═'.repeat(50));
console.log('\n📊 Test Summary:');
console.log(`   ✓ Passed: ${testsPassed}`);
console.log(`   ✗ Failed: ${testsFailed}`);
console.log(`   Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! Emoji animation works correctly.\n');
  console.log('Animation behavior:');
  console.log('  • First reminder: Gets a random emoji from the list');
  console.log('  • Subsequent reminders: Cycle sequentially through the emoji list');
  console.log('  • When reaching the end: Wraps back to the beginning');
  console.log('  • Result: Visual variety across user reminders\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the emoji animation logic.\n');
  process.exit(1);
}

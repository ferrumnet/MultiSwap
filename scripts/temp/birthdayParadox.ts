/**
 * Function to calculate the probability of no collisions using BigInt
 * @param numUsers - The number of users
 * @param numBits - The number of bits for the ID space
 * @returns The probability of no collisions as a string
 */
function calculateNoCollisionProbabilityBigInt(numUsers: number, numBits: number): string {
    const n = BigInt(2) ** BigInt(numBits); // Total number of unique IDs
    const k = BigInt(numUsers); // Number of users

    if (k > n) {
        return '0';
    }

    let logProbability = 0;

    for (let i = 0n; i < k; i++) {
        if (i % 10000000n === 0n) console.log(i);
        logProbability += Math.log(Number(n - i)) - Math.log(Number(n));
    }

    const probability = Math.exp(logProbability);
    
    return probability.toString();
}

function calculateBase64Length(numBits: number): number {
    const base64Bits = 6;
    const fullSegments = Math.floor(numBits / base64Bits);
    const remainingBits = numBits % base64Bits;
    const extraCharacter = remainingBits > 0 ? 1 : 0;
    const totalBase64Chars = fullSegments + extraCharacter;

    return totalBase64Chars;
}

const numUsers = 1000000;
const numBits = 64;

const noCollisionProbability = calculateNoCollisionProbabilityBigInt(numUsers, numBits);
const collisionProbability = (1 - Number(noCollisionProbability));
console.log(`Probability of no collisions: ${noCollisionProbability}`);
console.log(`Probability of collisions: ${collisionProbability}`);

const base64Length = calculateBase64Length(numBits);
console.log(`Number of Base64 characters: ${base64Length}`);

import * as fs from 'fs';
import * as path from 'path';

function formatNumbers(filePath: string): string[] {
    try {
        // Resolve the file path to ensure correctness
        const resolvedPath = path.resolve(filePath);
        // Read the file content
        const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
        
        // Split the content by line breaks and trim any extra whitespace
        const numbersArray = fileContent.trim().split('\n').map(line => line.trim());
        console.log('Numbers:', numbersArray);
        
        // Return the array of numbers in double quotes
        return numbersArray;
    } catch (error) {
        console.error('Error reading the file:', error);
        return [];
    }
}

// Usage example
const filePath = './scripts/temp/rng.txt'; // Ensure this path is correct
const formattedNumbers = formatNumbers(filePath);
console.log(formattedNumbers);

// To save the formatted array to a new file in JSON format (optional)
try {
    fs.writeFileSync('./scripts/temp/rng.json', JSON.stringify(formattedNumbers, null, 2), 'utf-8');
    console.log('File saved successfully');
} catch (error) {
    console.error('Error writing to file:', error);
}

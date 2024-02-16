const { ethers } = require('ethers');

async function validateSignature(msgHash, signature, expectedSigner) {
  try {
    // Convert signature to BytesLike format
    const bytesSignature = ethers.utils.arrayify(signature);

    // Recover the signer's address from the message hash and signature
    const recoveredAddress = ethers.utils.recoverAddress(msgHash, bytesSignature);

    // Compare the recovered address with the expected signer address
    if (recoveredAddress.toLowerCase() === expectedSigner.toLowerCase()) {
      console.log('Signature is valid!');
      return true;
    } else {
      console.error('Invalid signer address:', recoveredAddress);
      return false;
    }
  } catch (error) {
    console.error('Error validating signature:', error.message);
    return false;
  }
}
// Example usage:
const msgHash = '0x'; // Replace with your actual message hash
const signature = '0x'; // Replace with your actual signature
const expectedSigner = '0x'; // Replace with your expected signer address

validateSignature(msgHash, signature, expectedSigner);

import { ethers } from "hardhat";
import abi from "./abi.json";

function computeSelector(signature: string) {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(signature));
  return hash.slice(0, 10);
}

function getTypeString(input: any): string {
  if (input.type === "tuple" || input.type === "tuple[]") {
    const tupleType = input.components.map(component => getTypeString(component)).join(",");
    if (input.type === "tuple[]") {
      return `(${tupleType})[]`;
    }
    return `(${tupleType})`;
  } else if (input.type.includes('[]')) {
    const baseType = input.type.replace('[]', '');
    return `${getTypeString({ type: baseType })}[]`;
  } else {
    return input.type;
  }
}

async function main() {
  abi.filter(item => item.type === "function").forEach(func => {
    const signature = `${func.name}(${func.inputs!.map(input => getTypeString(input)).join(",")})`;
    console.log(`${signature}: ${computeSelector(signature)}`);
  });
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

contract FunctionsSource {
    string public getNftMetadata = "const { ethers } = await import('npm:ethers@6.10.0');"
        "const abiCoder = ethers.AbiCoder.defaultAbiCoder();" "const apiResponse = await Functions.makeHttpRequest({"
        "    url: `https://api.bridgedataoutput.com/api/v2/OData/test/Property('P_5dba1fb94aa4055b9f29696f')?access_token=6baca547742c6f96a6ff71b138424f21`,"
        "});" "const realEstateAddress = apiResponse.data.UnparsedAddress;"
        "const yearBuilt = Number(apiResponse.data.YearBuilt);"
        "const lotSizeSquareFeet = Number(apiResponse.data.LotSizeSquareFeet);"
        "const encoded = abiCoder.encode([`string`, `uint256`, `uint256`], [realEstateAddress, yearBuilt, lotSizeSquareFeet]);"
        "return ethers.getBytes(encoded);";

    string public getPrices = "const { ethers } = await import('npm:ethers@6.10.0');"
        "const abiCoder = ethers.AbiCoder.defaultAbiCoder();" "const tokenId = args[0];"
        "const apiResponse = await Functions.makeHttpRequest({"
        "    url: `https://api.bridgedataoutput.com/api/v2/OData/test/Property('P_5dba1fb94aa4055b9f29696f')?access_token=6baca547742c6f96a6ff71b138424f21`,"
        "});" "const listPrice = Number(apiResponse.data.ListPrice);"
        "const originalListPrice = Number(apiResponse.data.OriginalListPrice);"
        "const taxAssessedValue = Number(apiResponse.data.TaxAssessedValue);"
        "const encoded = abiCoder.encode([`uint256`, `uint256`, `uint256`, `uint256`], [tokenId, listPrice, originalListPrice, taxAssessedValue]);"
        "return ethers.getBytes(encoded);";
}
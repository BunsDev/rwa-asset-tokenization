// Warning: Do not copy/paste this code
// Please refer to the supplied example code in the
// repository instead.
// The code here has been slightly changed to escape
// special characters in order to be displayed on the
// web-page.
export const CONTRACT_CODE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import { FunctionsClient } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import { FunctionsRequest } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import { ConfirmedOwner } from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

import { Base64 } from "@openzeppelin/contracts/utils/Base64.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { ERC721Burnable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/**
 * @title Chainlink Functions example consuming Real Estate API
 */
contract RealEstate is
    FunctionsClient,
    ConfirmedOwner,
    ERC721("Tokenized Real Estate", "tRE"),
    ERC721URIStorage,
    ERC721Burnable
{
    using FunctionsRequest for FunctionsRequest.Request;
    using SafeERC20 for IERC20;

    struct APIResponse {
        string tokenId;
        string response;
    }

    struct Houses {
        string tokenId;
        address recipientAddress;
        string homeAddress; 
        string listPrice; 
        string squareFootage;
        string bedRooms;
        string bathRooms;
        uint createTime;
    }

    // Chainlink Functions script source code.
    string private constant SOURCE_PRICE_INFO =
        "const id = args[0];"
        "const priceResponse = await Functions.makeHttpRequest({"
        "url: \`https://api.chateau.voyage/house/$\{id}\`,"
        "});"
        "if (priceResponse.error) {"
        "throw Error('Housing Price Request Error');"
        "}"
        "const price = priceResponse.data.latestValue;"
        "return Functions.encodeString(price);";

    bytes32 public donId; // DON ID for the Functions DON to which the requests are sent
    uint64 private subscriptionId; // Subscription ID for the Chainlink Functions
    uint32 private gasLimit; // Gas limit for the Chainlink Functions callbacks

    uint private _totalHouses;

    // Mapping of request IDs to API response info
    mapping(bytes32 => APIResponse) public requests;
    mapping(string => bytes32) public latestRequestId;
    mapping(string tokenId => string price) public latestPrice;

    Houses[] public houseInfo;

    event LastPriceRequested(bytes32 indexed requestId, string tokenId);
    event LastPriceReceived(bytes32 indexed requestId, string response);

    event RequestFailed(bytes error);

    constructor(
        address router,
        bytes32 _donId,
        uint64 _subscriptionId,
        uint32 _gasLimit
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        donId = _donId;
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
    }

    /**
     * @notice Request \`houseInfo\` for a given \`tokenId\`
     */
    function issueHouse(
        address recipientAddress, 
        string memory homeAddress, 
        string memory listPrice,
        string memory squareFootage,
        string memory bedRooms,
        string memory bathRooms
    ) external {
        uint index = _totalHouses;
        string memory tokenId = string(abi.encode(index));

        // increase totalHouses.
        _totalHouses++;

        // [then] create: instance of a House.
       houseInfo.push(Houses({
            tokenId: tokenId,
            recipientAddress: recipientAddress,
            homeAddress: homeAddress,
            listPrice: listPrice,
            squareFootage: squareFootage,
            bedRooms: bedRooms,
            bathRooms: bathRooms,
            createTime: block.timestamp
        }));

        setURI(
            index,
            homeAddress,
            listPrice, 
            squareFootage,
            bedRooms,
            bathRooms
        );

        _safeMint(recipientAddress, index);
    }

    /**
     * @notice Request \`lastPrice\` for a given \`tokenId\`
     * @param tokenId id of said token e.g. 0
     */
    function requestLastPrice(string calldata tokenId) external {
        string[] memory args = new string[](1);
        args[0] = tokenId;
        bytes32 requestId = _sendRequest(SOURCE_PRICE_INFO, args);
        // maps: \`tokenId\` associated with a given \`requestId\`.
        requests[requestId].tokenId = tokenId;

        latestRequestId[tokenId] = requestId;

        emit LastPriceRequested(requestId, tokenId);
    }

    /**
     * @notice Construct and store a URI containing the off-chain data.
     * @param tokenId the tokenId associated with the home.
     * @param homeAddress the address of the home.
     * @param listPrice year the home was built.
     * @param squareFootage size of the home (in ft^2)
     * @param bedRooms number of bedrooms in the home.
     * @param bathRooms number of bathrooms in the home.
     */
    function setURI(
        uint tokenId,
        string memory homeAddress,
        string memory listPrice,
        string memory squareFootage,
        string memory bedRooms,
        string memory bathRooms
    ) internal {
        // [then] create URI: with property details.
        string memory uri = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Tokenized Real Estate",'
                        '"description": "Tokenized Real Estate",',
                        '"image": "",'
                        '"attributes": [',
                        '{"trait_type": "homeAddress",',
                        '"value": ',
                        homeAddress,
                        "}",
                        ',{"trait_type": "listPrice",',
                        '"value": ',
                        listPrice,
                        "}",
                        ',{"trait_type": "squareFootage",',
                        '"value": ',
                        squareFootage,
                        "}",
                        ',{"trait_type": "bedRooms",',
                        '"value": ',
                        bedRooms,
                        "}",
                        ',{"trait_type": "bathRooms",',
                        '"value": ',
                        bathRooms,
                        "}",
                        "]}"
                    )
                )
            )
        );
            // [then] create: finalTokenURI: with metadata.
            string memory finalTokenURI = string(abi.encodePacked("data:application/json;base64,", uri));

            // [then] set: tokenURI for a given \`tokenId\`, containing metadata.
            _setTokenURI(tokenId, finalTokenURI);

    }

    /**
     * @notice Process the response from the executed Chainlink Functions script
     * @param requestId The request ID
     * @param response The response from the Chainlink Functions script
     */
    function _processResponse(
        bytes32 requestId,
        bytes memory response
    ) private {
            requests[requestId].response = string(response);
            string memory tokenId = requests[requestId].tokenId;

            // store: latest price for a given \`requestId\`.
            latestPrice[tokenId] = string(response);
            emit LastPriceReceived(requestId, string(response));
    }

    // CHAINLINK FUNCTIONS //

    /**
     * @notice Triggers an on-demand Functions request
     * @param args String arguments passed into the source code and accessible via the global variable \`args\`
     */
    function _sendRequest(
        string memory source,
        string[] memory args
    ) internal returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequest(
            FunctionsRequest.Location.Inline,
            FunctionsRequest.CodeLanguage.JavaScript,
            source
        );
        if (args.length > 0) {
            req.setArgs(args);
        }
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );
    }

    /**
     * @notice Fulfillment callback function
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (err.length > 0) {
            emit RequestFailed(err);
            return;
        }
        _processResponse(requestId, response);
    }

    // OWNER //

    /**
     * @notice Set the DON ID
     * @param newDonId New DON ID
     */
    function setDonId(bytes32 newDonId) external onlyOwner {
        donId = newDonId;
    }

    /**
     * @notice Set the gas limit
     * @param newGasLimit new gas limit
     */
    function setCallbackGasLimit(uint32 newGasLimit) external onlyOwner {
        gasLimit = newGasLimit;
    }

    // ERC721 SETTINGS //

    // gets: tokenURI for a given \`tokenId\`.
    function tokenURI(
        uint tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // checks: interface is supported by this contract.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function totalHouses() public view returns (uint) {
        return _totalHouses;
    }
}
`

export const TABS = [
  {
    label: 'Contracts Imports',
    content:
      'This is where we tell our smart contract that we want to use Chainlink Functions.',
    highlightedLines: Array.from({ length: 11 }, (v, k) => 4 + k),
  },
  {
    label: 'JavaScript Source',
    content:
      'This is where the JavaScript code that Chainlink Functions will execute is stored. By storing it on-chain, we have guarantees that this and only this code will be executed.',
    highlightedLines: Array.from({ length: 11 }, (v, k) => 45 + k),
  },
  {
    label: 'Subscription ID',
    content:
      'This is where the Chainlink Functions <a class="explainer-link" href="https://docs.chain.link/chainlink-functions/resources/subscriptions">subscription ID</a> is stored. This is required for your smart contract to use Chainlink Functions.',
    highlightedLines: [58],
  },
  {
    label: 'Functions Initialization',
    content:
      'In this contract\'s constructor, we set some Chainlink Functions specific configuration values such as the <a class="explainer-link" href="https://docs.chain.link/chainlink-functions/supported-networks">DON ID</a>, Functions <a class="explainer-link" href="https://docs.chain.link/chainlink-functions/resources/subscriptions">subscription ID</a> and gas limit for the callback transaction.',
    highlightedLines: Array.from({ length: 10 }, (v, k) => 75 + k),
  },
  {
    label: 'Functions Request',
    content:
      'This is the function called by the UI when a new request is initiated. It sends the request to the Chainlink Functions DoN, along with all associated parameters, such as the JavaScript code to execute, subscription ID, gas limit for the callback transaction, and DoN ID of the Chainlink Functions network we wish to execute the code on.',
    highlightedLines: Array.from({ length: 15 }, (v, k) => 127 + k),
  },
  {
    label: 'Functions Response',
    content:
      'This is the function called by the Chainlink Functions DoN when it receives a response from the JavaScript code executed off-chain in the Chainlink Function.',
    highlightedLines: Array.from({ length: 16 }, (v, k) => 202 + k),
  },
]
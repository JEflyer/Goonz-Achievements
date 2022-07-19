//SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

//Import ERC721Enumerable
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract Acheivements is ERC721Enumerable {

    event NewAdmin(address _new);    
    event NewAchievement(string achievement);
    event NewBaseURI(string base);
    event Unlocked(address unlocker, string acheivement);
    event NewPermissionGiver(address permissionGiver);

    //Stores the address of the admin
    address private admin;

    //Store the address of the permission giver
    address private permissionGiver;

    //Stores an array of the different achievement strings e.g. "50_Wins"
    string[] private acheivementStrings;

    //user => achievementName => bool
    mapping(address => mapping(string => bool)) private isAchieved;

    //Stores the start of the tokenURI
    string private baseURI;

    //tokenId => Defining part of URI
    mapping(uint256 => string) private URIs;

    //Stores the current highest token minted
    uint256 private mintCounter;


    constructor(string memory name, string memory symbol, string[] memory _strings, string memory _base,address _permGiver) ERC721(name,symbol){
        //Asign the caller as the admin
        admin = _msgSender();

        //Store the base URI
        baseURI = _base;

        //Store the array of achievement names
        acheivementStrings = _strings;

        //Store the address of the permission giver
        permissionGiver = _permGiver;
    }

    modifier onlyAdmin {
        //Check that the caller of the function this modifier is attached to is the admin of this contract
        require(_msgSender() == admin, "ERRR:NA");//NA => Not Admin

        //Run the rest of the code in the function this modifier is attached to
        _;
    }

    function changeAdmin(address _new) external onlyAdmin {

        //Assign the new admin
        admin = _new;

        //Emit event
        emit NewAdmin(_new);
    }

    function changePermissionGiver(address _new) external onlyAdmin {

        //Assign the new permission giver
        permissionGiver = _new;

        //Emit event
        emit NewPermissionGiver(_new);
    }

    function addNewAcheivement(string memory _new) external onlyAdmin {
        
        //Add the new achievement name to the array of achievement names
        acheivementStrings.push(_new);

        //Emit event
        emit NewAchievement(_new);
    }

    function setBaseURI(string memory _new) external onlyAdmin {
        
        //Store the new Base URI
        baseURI = _new;

        //Emit event
        emit NewBaseURI(_new);
    }

    //This function uses eliptic curve cryptography to verify that the signature was made by the permission giver  
    function VerifyMessage(
        bytes32 _hashedMessage,
        uint8 _v,
        bytes32 _r,
        bytes32 _s,
        string memory _achievement
    ) internal view returns (bool) {
        //Check that the message does equal the keccak256 hash of the msg.senders address
        require(_hashedMessage == keccak256(abi.encode(_achievement,msg.sender)), "ERR:WM"); // WM -> Wrong Message

        //Define a string to be prefixed to the hashed message
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";

        //Combine the prefix & hashedMessage
        bytes32 prefixedHashMessage = keccak256(
            abi.encodePacked(prefix, _hashedMessage)
        );

        //Retrieve the signing address of the message
        address signer = ecrecover(prefixedHashMessage, _v, _r, _s);

        //Require that the signer is the admin of the contract, return bool accordingly
        return (signer == permissionGiver) ? true : false;
    }

    function unlockAcheivement(
        uint16 acheivementID,
        bytes32 _hashedMessage,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {

        //Check that the acheivementID is a valid ID
        require(acheivementID < acheivementStrings.length, "ERR:WI");//WI => Wrong ID
        
        //Pull the achievement string into memory
        string memory acheivementString = acheivementStrings[acheivementID];
    
        //Check that the signature is valid for the hashed message
        require(VerifyMessage(_hashedMessage,_v,_r,_s,acheivementString),"ERR:OV");//OV => On Verify

        //Get the caller of this function
        address caller = _msgSender();

        //Check that they don't already have the achievement
        require(!isAchieved[caller][acheivementString], "ERR:AU");//AU => Achievement Unlocked

        //Assign the achievement
        isAchieved[caller][acheivementString] = true;

        //Pull the new token ID into memory
        uint256 token = mintCounter + 1;

        //Assign the ending of the tokenURI for the new token
        URIs[token] = acheivementString;

        //Mint token to caller
        _mint(caller, token);

        //Set the new counter in storage
        mintCounter = token;

        //Emit event
        emit Unlocked(caller, acheivementString);
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory uri)
    {
        require(_exists(_tokenId));

        uri = string(
            abi.encodePacked(
                baseURI,
                URIs[_tokenId],
                ".JSON"
            )
        );
    }

    //returns an array of tokens held by a wallet
    function walletOfOwner(address _wallet) public view  returns(uint16[] memory ids){
        uint16 ownerTokenCount = uint16(balanceOf(_wallet));
        ids = new uint16[](ownerTokenCount);
        for(uint16 i = 0; i< ownerTokenCount; i++){
            ids[i] = uint16(tokenOfOwnerByIndex(_wallet, i));
        }
    }

    function getAchievement(uint256 tokenId) external view returns(string memory){
        require(_exists(tokenId),"ERR:IT");//IT => Invalid Token
        return URIs[tokenId];
    }

    function getAchievementStrings() external view returns(string[] memory){
        return acheivementStrings;
    }

}
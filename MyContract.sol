pragma solidity ^0.8.0;

contract MyContract {
    address[16] public tikets;
    uint public balanceWei = 0;
    address payable public admin  = payable(0xc8D55b1AEe0AF99A99A83Cab4b80fE54032b75c2);


    function transferBalanceToAdmin () public {
        require(msg.sender == admin, "No eres el admin");
        
        admin.transfer(balanceWei);
        balanceWei = 0;
    }

    function buyTiket(uint tiketIndex) payable public returns (bool) {
        // Comprobación
        require(tiketIndex >= 0 && tiketIndex <= 15);
        require(msg.value == 0.02 ether, "Insuficient amount of BNB");
        balanceWei += msg.value;


        bool sucess = true;
        
        if ( tikets[tiketIndex] == address(0) ){
            // msg.sender address del usuario que invoco al contrato
            tikets[tiketIndex] = msg.sender;
        } else {
            sucess = false ;
        }

        return sucess;
    }

       
    function getTikets() public view returns (address[16] memory) {
        return tikets;
    }

}


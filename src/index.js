import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import { useState, useEffect, useRef } from 'react';
import bankManifest from "./contracts/Bank.json";

function App() {
  const bank = useRef(null);
  const [balance, setBalance] = useState();
  const [interest, setInterest] = useState();
  const [doubleInterestBalance, setDoubleInterestBalance] = useState();
  const [doubleInterest, setDoubleInterest] = useState();
  const [amount, setAmount] = useState(1);
  const [contractBalance, setContractBalance] = useState();
  const [bnbFromSales, setBNBFromSales] = useState();

  useEffect(() => {
    initContracts();
  }, [])

  let initContracts = async () => {
    await getBlockchain();

    updateBank();
  }

  let updateBank = async () => {
    let balanceFromBlockchain = await bank.current?.getClientBalanceBNB();
    if (balanceFromBlockchain != null) {
      let b = ethers.utils.formatEther(balanceFromBlockchain);
      setBalance(b)
    }
    else
      setBalance(0)

    let interestFromBlockchain = await bank.current?.getClientBalanceBMIW();
    if (interestFromBlockchain != null) {
      let b = ethers.utils.formatEther(interestFromBlockchain);
      setInterest(b)
    }
    else
      setInterest(0)

    let diBalanceFromBlockchain = await bank.current?.getClientBalanceBNBDoubleInterest();
    if (diBalanceFromBlockchain != null) {
      let b = ethers.utils.formatEther(diBalanceFromBlockchain);
      setDoubleInterestBalance(b)
    }
    else
      setDoubleInterestBalance(0)

    let doubleInterestFromBlockchain = await bank.current?.getClientBalanceBMIWDoubleInterest();
    if (doubleInterestFromBlockchain != null) {
      let b = ethers.utils.formatEther(doubleInterestFromBlockchain);
      setDoubleInterest(b)
    }
    else
      setDoubleInterest(0)

    let contractBalanceFromBlockchain = await bank.current?.getBalance();
    if (contractBalanceFromBlockchain != null) {
      let b = ethers.utils.formatEther(contractBalanceFromBlockchain);
      setContractBalance(b)
    }
    else
      setContractBalance(0)

    let bnbFromSalesFromBlockchain = await bank.current?.getBNBFromSales();
    if (bnbFromSalesFromBlockchain != null) {
      let b = ethers.utils.formatEther(bnbFromSalesFromBlockchain);
      setBNBFromSales(b)
    }
    else
      setBNBFromSales(0)
  }

  const updateAmount = (e) => {
    const value = parseFloat(e.target.value);
    setAmount(value);
  };

  let getBlockchain = async () => {
    let provider = await detectEthereumProvider();
    if (provider) {
      await provider.request({ method: 'eth_requestAccounts' });
      const networkId = await provider.request({ method: 'net_version' })

      provider = new ethers.providers.Web3Provider(provider);
      const signer = provider.getSigner();

      bank.current = new Contract(
        bankManifest.networks[networkId].address,
        bankManifest.abi,
        signer
      );

    }
    return null;
  }

  let onSubmitDeposit = async (e) => {
    e.preventDefault();

    const BNBamount = parseFloat(e.target.elements[0].value);

    // Wei to BNB se pasa con ethers.utils recibe un String!!!
    const tx = await bank.current.deposit({
      value: ethers.utils.parseEther(String(BNBamount)),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    });

    await tx.wait();

    updateBank();
  }

  let onSubmitDoubleInterestDeposit = async (e) => {
    e.preventDefault();

    const BNBamount = parseFloat(e.target.elements[0].value);

    // Wei to BNB se pasa con ethers.utils recibe un String!!!
    const tx = await bank.current.depositDoubleInteresr({
      value: ethers.utils.parseEther(String(BNBamount)),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    });

    await tx.wait();

    updateBank();
  }

  let clickWithdraw = async () => {
    // Wei to BNB se pasa con ethers.utils recibe un String!!!
    const tx = await bank.current.withdraw({
      value: ethers.utils.parseEther("0.05"),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    });

    try {
      await tx.wait()
      updateBank();
    } catch (error) {
      alert('Error, no previous deposit');
    }

    updateBank();

    updateBank();
  }

  let clickWithdrawDoubleInterest = async () => {
    // Wei to BNB se pasa con ethers.utils recibe un String!!!
    const tx = await bank.current.withdrawDoubleInterest({
      value: ethers.utils.parseEther("0.05"),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    });

    try {
      await tx.wait()
      updateBank();
    } catch (error) {
      alert('You must wait at least 10 minutes before withdraw');
    }

    updateBank();
  }

  const clickBuyBMIW = async (e) => {
    e.preventDefault();

    const inputValue = e.target.elements[0].value;

    const tx = await bank.current.buyBMIW(inputValue, {
      value: ethers.utils.parseEther((inputValue*0.001).toString()),
      gasLimit: 6721975,
      gasPrice: 20000000000,
    });

    await tx.wait();

    updateBank();
  };

  return (
    <div>
      <h1>Bank</h1>
      <h3>Regular deposit</h3>
      <form onSubmit={(e) => onSubmitDeposit(e)} >
        <input type="number" step="0.01" />
        <button type="submit">Deposit</button>
      </form>
      <br></br>
      <p>Balance: {balance} BNB</p>
      <p>Interest: {interest} BMIW</p>
      <button onClick={() => clickWithdraw()} > Withdraw (0.05 BNB)</button>
      <br></br><br></br>

      <h3>Double interest deposit</h3>
      <form onSubmit={(e) => onSubmitDoubleInterestDeposit(e)} >
        <input type="number" step="0.01" />
        <button type="submit">Deposit</button>
      </form>
      <br></br>
      <p>Balance: {doubleInterestBalance} BNB</p>
      <p>Interest: {doubleInterest} BMIW</p>
      <button onClick={() => clickWithdrawDoubleInterest()} > Withdraw (0.05 BNB)</button>
      <br></br><br></br>

      <h3>Buy BMIW</h3>
      <form onSubmit={(e) => clickBuyBMIW(e)}>
        <input
          type="number"
          step="1"
          min={1}
          value={amount}
          onChange={(e) => updateAmount(e)}
        />
        <button type="submit">Buy for {amount * 0.001} BNB</button>
      </form>
      <br></br><br></br>
      <p>Contrct Balance: {contractBalance} BNB</p>
      <p>BNB from Sales: {bnbFromSales} BNB</p>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

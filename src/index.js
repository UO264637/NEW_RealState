import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers } from "ethers";
import myContractManifest from "./contracts/MyContract.json";
import { useState, useEffect, useRef } from 'react';

function App() {
  const myContract = useRef(null);
  const [tikets, setTikets] = useState([]);
  const [balance, setBalance] = useState();
  const [balanceWei, setBalanceWei] = useState();
  const [walletBalance, setWalletBalance] = useState();

  useEffect(() => {
    initContracts();
  }, [])

  let initContracts = async () => {
    await configureBlockchain();
    let tiketsFromBlockchain = await myContract.current?.getTikets();
    if (tiketsFromBlockchain != null)
      setTikets(tiketsFromBlockchain)

    updateBalances();
  }

  let updateBalances = async () => {
    let balanceFromBlockchain = await myContract.current?.getBalance();
    if (balanceFromBlockchain != null) {
      let a = ethers.utils.formatEther(balanceFromBlockchain);
      setBalance(a)
      console.log(a)
    }
    else
      setBalance(0)

    let balanceWeiFromBlockchain = await myContract.current?.getBalanceWei();
    if (balanceWeiFromBlockchain != null) {
      let b = balanceWeiFromBlockchain.toString()
      setBalanceWei(b)
      console.log(b)
    }
    else
      setBalanceWei(0)
  }

  let updateWallet = async () => {
    let userAddress = await  myContract.current.signer.getAddress();
        let wb = await  myContract.current.provider.getBalance(userAddress);
        setWalletBalance(ethers.utils.formatEther(wb));
  }

  let configureBlockchain = async () => {
    try {
      let provider = await detectEthereumProvider();
      if (provider) {
        await provider.request({ method: 'eth_requestAccounts' });
        const networkId = await provider.request({ method: 'net_version' })

        provider = new ethers.providers.Web3Provider(provider);
        const signer = provider.getSigner();

        myContract.current = new Contract(
          myContractManifest.networks[networkId].address,
          myContractManifest.abi,
          signer,
          provider
        );
        updateWallet();
      }
    } catch (error) { console.log(error)}
  }

  let clickBuyTiket = async (i) => {
    if (walletBalance > 0.02) {
      myContract.current.isTicketAvailable(i).then(
        (result) => { },
        (error) => {console.log(error); alert(error.message)}
      );

      const tx = await myContract.current.buyTiket(i, {
        value: ethers.utils.parseEther("0.02"),
        gasLimit: 6721975,
        gasPrice: 20000000000,
      });
      await tx.wait();

      const tiketsUpdated = await myContract.current.getTikets();
      setTikets(tiketsUpdated);

      updateBalances();
      updateWallet();
    }
    else {
      alert("Not enough BNB")
    }
  }

  let withdrawBalance = async () => {
    const tx = await myContract.current.transferBalanceToAdmin().then(
        (result) => { },
        (error) => { alert(error.data.message)}
    );
    await tx.wait();
    
    updateBalances();
    updateWallet();
  }

  return (
    <div>
      <h1>Tikets store</h1>
      <p>
        <label>Balance: </label> {balance}<br></br>
        <label>Balance Wei: </label> {balanceWei}
        <button onClick={() => withdrawBalance()}>Withdraw Balance</button>
      </p>

      <p>
        <label>Wallet Balance: </label> {walletBalance}<br></br>
      </p>
      
      <ul>
        {tikets.map((address, i) =>
          <li>Tiket {i} comprado por {address}
            {address == ethers.constants.AddressZero &&
              <a href="#" onClick={() => clickBuyTiket(i)}> buy</a>}
          </li>
        )}
      </ul>
    </div>
  )
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

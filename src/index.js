import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers, utils } from "ethers";
import myContractManifest from "./contracts/MyContract.json";
import { useState, useEffect, useRef } from 'react';
import { decodeError } from 'ethers-decode-error';

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
      let bal = ethers.utils.formatEther(balanceFromBlockchain);
      setBalance(bal);
    }
    else
      setBalance(0);

    let balanceWeiFromBlockchain = await myContract.current?.getBalanceWei();
    if (balanceWeiFromBlockchain != null) {
      let balWei = ethers.utils.formatEther(balanceWeiFromBlockchain);
      setBalanceWei(balWei);
    }
    else
      setBalanceWei(0);
  }

  let updateWallet = async () => {
    let userAddress = await myContract.current.signer.getAddress();
    let wb = await myContract.current.provider.getBalance(userAddress);
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
    } catch (error) { console.log(error) }
  }

  let clickBuyTiket = async (i) => {
    if (walletBalance > 0.02) {
      const tx = await myContract.current.buyTiket(11, {
        value: ethers.utils.parseEther("0.02"),
        gasLimit: 6721975,
        gasPrice: 20000000000,
      })

      try {
        await tx.wait()
        const tiketsUpdated = await myContract.current.getTikets();
        setTikets(tiketsUpdated);
        updateBalances();
        updateWallet();
      } catch (error) {
        const errorDecoded = decodeError(error);
        alert('Revert reason: ' + errorDecoded.error);
      }
    }
    else {
      alert("Not enough BNB")
    }
  }

  let withdrawBalance = async () => {
    const tx = await myContract.current.transferBalanceToAdmin().then(
      (result) => { },
      (error) => { alert(decodeError(error).error) }
    );
    try {
      await tx.wait();

      updateBalances();
      updateWallet();
    }
    catch (error) { }
  }

  let changeAdmin = async (e) => {
    //evita que avance a la página del formulario
    e.preventDefault();

    const inputValue = e.target.elements[0].value;
    if (utils.isAddress(inputValue)) {
      await myContract.current.setAdmin(inputValue).then(
        (result) => { alert("Admin updated")},
        (error) => { alert(decodeError(error).error) }
      );
    }
    else {
      alert("Address not valid")
    }
  };

  return (
    <div>
      <h1>Tikets store</h1>
      <p>
        <label>Balance: </label> {balance}<br></br>
        <label>Balance Wei: </label> {balanceWei}
        <button onClick={() => withdrawBalance()}>Withdraw Balance</button>
      </p>
      <form className="form-inline" onSubmit={(e) => changeAdmin(e)}>
        <label>New Admin: </label>
        <input type="text" />
        <button type="submit" > Change </button>
      </form>

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

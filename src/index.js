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

  let clickBuyTiket = async (e, i) => {
    e.preventDefault();
    const inputValue = e.target.elements[0].value;
    console.log(inputValue);

    if (walletBalance > inputValue) {
      const tx = await myContract.current.buyTiket(i, {
        value: ethers.utils.parseEther(inputValue),
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
        (result) => { alert("Admin updated") },
        (error) => { alert(decodeError(error).error) }
      );
    }
    else {
      alert("Address not valid")
    }
  };

  let clickTransferTicket = async (e) => {
    e.preventDefault();

    const inputTicket = e.target.elements[0].value;
    const inputAddress = e.target.elements[1].value;

    if (utils.isAddress(inputAddress)) {
      const tx = await myContract.current.transferTicket(inputTicket, inputAddress).then(
        async (result) => { alert("Ticket transferred");
        const tiketsUpdated = await myContract.current.getTikets();
        setTikets(tiketsUpdated);
      },
        (error) => { alert(decodeError(error).error) }
      );
    }
    else {
      alert("Address not valid")
    }
  }


  return (
    <div>
      <h1>Tikets store</h1>
      <p>
        Balance: {balance} BNB<br></br>
        Balance Wei: {balanceWei} BNB
        <button style={{ marginLeft: '10px' }} onClick={() => withdrawBalance()}>Withdraw Balance</button>
      </p>
      <form className="form-inline" onSubmit={(e) => changeAdmin(e)}>
        <label>New Admin: </label>
        <input style={{ marginLeft: '10px' }} type="text" />
        <button type="submit" > Change </button>
      </form>
      <br></br>
      <p>
        Wallet Balance: {walletBalance} BNB<br></br>
      </p>
      <ul>
        {tikets.map((address, i) =>
          <li key={i} style={{ display: 'flex' }}>
            <span>
              Tiket {i} comprado por {address}
            </span>
            {address === ethers.constants.AddressZero && (
              <form className="form-inline" onSubmit={(e) => clickBuyTiket(e, i)}>
                <input
                  type="number"
                  defaultValue={0.01}
                  min={0.01}
                  step={0.01}
                  style={{ width: '50px', marginLeft: '10px' }}
                />
                <label> BNB</label>
                <button type="submit" style={{ marginLeft: '10px' }}> Buy </button>
              </form>
            )}
          </li>
        )}
      </ul>
      <br></br>
      <form className="form-inline" onSubmit={(e) => clickTransferTicket(e)}>
        <label>Transfer ticket number: </label>
        <input
          type="number"
          defaultValue={0}
          min={0}
          step={1}
          max={15}
          style={{ width: '40px', marginLeft: '10px', marginRight: '10px' }}
        />
        <label> To address: </label>
        <input style={{ marginLeft: '10px' }} type="text" />
        <button type="submit" > Transfer </button>
      </form>
    </div>
  )
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

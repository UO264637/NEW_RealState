import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import detectEthereumProvider from "@metamask/detect-provider";
import { Contract, ethers, utils } from "ethers";
import { useState, useEffect, useRef } from 'react';
import realStateContractManifest from "./contracts/RealStateContract.json";
import realStateContractCitiesManifest from "./contracts/RealStateContractCities.json";
import { decodeError } from 'ethers-decode-error';

function App() {
  const realStateCities = useRef(null);
  const realState = useRef(null);
  const [realStateArray, setRealStateArray] = useState([])

  useEffect(() => {
    initContracts();
  }, [])

  let initContracts = async () => {
    await getBlockchain();
  }

  let getBlockchain = async () => {
    let provider = await detectEthereumProvider();
    if (provider) {
      await provider.request({ method: 'eth_requestAccounts' });
      const networkId = await provider.request({ method: 'net_version' })

      provider = new ethers.providers.Web3Provider(provider);
      const signer = provider.getSigner();

      realState.current = new Contract(
        realStateContractManifest.networks[networkId].address,
        realStateContractManifest.abi,
        signer
      );

      realStateCities.current = new Contract(
        realStateContractCitiesManifest.networks[networkId].address,
        realStateContractCitiesManifest.abi,
        signer
      );

    }
    return null;
  }

  let onSubmitAddRealState = async (e) => {
    e.preventDefault();

    const tx = await realStateCities.current.addRealState({
      city: e.target.elements[0].value,
      street: e.target.elements[1].value,
      number: parseInt(e.target.elements[2].value),
      meters: parseInt(e.target.elements[3].value),
      registration: parseInt(e.target.elements[4].value),
      owner: e.target.elements[5].value,
      price: e.target.elements[6].value
    }).then(
      (result) => { alert("Adding Real State...")},
      (error) => { alert("You do not have permissions to add a real state") }
    );
  }

  let onSubmitSearchRealState = async (e) => {
    e.preventDefault();

    let city = e.target.elements[0].value;

    let newProperties = await realStateCities.current.getRealStateByCity(city);
    setRealStateArray(newProperties)
  }

  let clickOnDeleteRealState = async (city, registration) => {
    const tx = await realStateCities.current.deleteRealStateByRegistration(city, registration);
    await tx.wait();
    setRealStateArray([])
  }

  let onSubmitAuthorizeAddres = async (e) => {
    e.preventDefault();

    const inputValue = e.target.elements[0].value;
    if (utils.isAddress(inputValue)) {
      await realStateCities.current.authorizeAddress(inputValue).then(
        (result) => { alert("Authorizing Address...") },
        (error) => { alert("Only the admin can authorize addresses") }
      );
    }
    else {
      alert("Address not valid")
    }
  };

  return (
    <div>
      <h1>RealState</h1>
      <form className="form-inline" onSubmit={(e) => onSubmitAuthorizeAddres(e)}>
        <label>Authorize Address: </label>
        <input style={{ marginLeft: '10px' }} type="text" />
        <button type="submit" > Authorize </button>
      </form>
      <h2>Add RealState</h2>
      <form onSubmit={(e) => onSubmitAddRealState(e)} >
        <input type="text" placeholder="city" />
        <input type="text" placeholder="street" />
        <input type="number" placeholder="number" />
        <input type="number" placeholder="meters" />
        <input type="number" placeholder="registration" />
        <input type="text" placeholder="owner name" />
        <input type="price" placeholder="price" />
        <button type="submit">Add</button>
      </form>
      <h2>Search RealState</h2>
      <form onSubmit={(e) => onSubmitSearchRealState(e)} >
        <input type="text" placeholder="city" />
        <button type="submit">Search</button>
      </form>
      {realStateArray.map((r) =>
      (<p>
        <button onClick={() => { clickOnDeleteRealState(r.city, r.registration) }}>Delete</button>
        {r.city} -
        {r.street} -
        {ethers.BigNumber.from(r.number).toNumber()} -
        {ethers.BigNumber.from(r.meters).toNumber()} -
        {ethers.BigNumber.from(r.registration).toNumber()} -
        {r.owner}
        {r.price == 0 ? '' : '-' +  r.price + '€'}
      </p>)
      )}
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

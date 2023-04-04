import { useEffect, useMemo, useState } from 'react'
import type { GetStaticPaths, GetStaticProps } from 'next'
import Image from 'next/image'
import type { ParsedUrlQuery } from 'querystring'
import { Layout } from '@vercel/examples-ui'

import type { Country } from '../types'
import shirt from '../public/shirt.png'
import map from '../public/map.svg'
import api from '../api'
import { PRODUCT_PRICE } from '../constants'
import { getParityPrice } from '../utils'
import toast from 'react-hot-toast'
import { Ethereum } from '../components/icons/ethereum'
import { Polygon } from '../components/icons/polygon'
import { Bnb } from '../components/icons/bnb'
import { Avax } from '../components/icons/avax'
import { Optimism } from '../components/icons/optimism'
import { Arbitrium } from '../components/icons/arbitrium'
import { Solana } from '../components/icons/solana'
import { Aptos } from '../components/icons/aptos'
import SelectDemo from '../components/ui/select'
import { ethers } from 'ethers'

interface Params extends ParsedUrlQuery {
  country: Country
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Get the list of countries
  const countries = await api.parity.list()

  return {
    paths: countries.map((country) => ({
      params: {
        country,
      },
    })),
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<unknown, Params> = async ({
  params,
}) => {
  // Get parity for country
  const parity = await api.parity.fetch(params.country)

  return {
    props: {
      country: params.country,
      parity,
    },
  }
}

export const chainsList = [
  {
    id: 1,
    chainId: 1,
    name: "Ethereum Mainnet",
    token: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    tokenName: "ETH",
    logo: Ethereum,
    decimals: 18,
    blockExplorer: "https://etherscan.io",
    selected: false,
    type: 'EVM'
  },
  {
    id: 2,
    chainId: 137,
    name: "Polygon Mainnet",
    token: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    tokenName: "MATIC",
    logo: Polygon,
    decimals: 18,
    blockExplorer: "https://polygonscan.io",
    selected: false,
    type: 'EVM'
  },
  {
    id: 3,
    chainId: 56,
    name: "BSC Mainnet",
    token: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    tokenName: "BNB",
    logo: Bnb,
    decimals: 18,
    blockExplorer: "https://bscscan.io",
    selected: false,
    type: 'EVM'
  },
  {
    id: 4,
    chainId: 43114,
    name: "Avalanche C-Chain Mainnet",
    token: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    tokenName: "AVAX",
    logo: Avax,
    decimals: 18,
    blockExplorer: "https://snowtrace.io",
    selected: false,
    type: 'EVM'
  },
  {
    id: 5,
    chainId: 10,
    name: "Optimism Mainnet",
    token: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    tokenName: "ETH",
    logo: Optimism,
    decimals: 18,
    blockExplorer: "https://optimistic.etherscan.io",
    selected: false,
    type: 'EVM'
  },
  {
    id: 6,
    chainId: 42161,
    name: "Arbitrium Mainnet",
    token: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    tokenName: "ETH",
    decimals: 18,
    logo: Arbitrium,
    blockExplorer: "https://arbiscan.io",
    selected: false,
    type: 'EVM'
  },
  {
    id: 7,
    chainId: 7,
    name: "Solana Mainnet",
    token: "11111111111111111111111111111111111111111111",
    tokenName: "SOL",
    logo: Solana,
    decimals: 9,
    blockExplorer: "https://solana.fm",
    selected: false,
    type: 'SOLANA'
  },
  {
    id: 8,
    chainId: 8,
    name: "Aptos Mainnet",
    token: "0x1::aptos_coin::AptosCoin",
    tokenName: "APT",
    decimals: 8,
    logo: Aptos,
    blockExplorer: "https://aptoscan.io",
    selected: false,
    type: 'APTOS'
  },
];

export default function CountryPage({ country, parity }) {
  const [parityPrice, setParityPrice] = useState(0.00000196)
  const [chain, setChain] = useState(chainsList)
  const [selected, setSelected] = useState(chainsList[0])
  const [fetcchId, setFetcchId] = useState("")
  const [message, setMessage] = useState("")
  const [requestId, setRequestId] = useState(0)
  const [toastId, setToastId] = useState("")

  useEffect(() => {

    if(requestId) {
      const interval = setInterval(async () => {
        const res = await fetch(`https://sandbox-api.fetcch.xyz/v1/request/?id=${requestId}`, {
          headers: {
          'secret-key': "87e4153d-bfc2-4880-a034-d614f2626103",
          'content-type': 'application/json'
        }})

        const data = await res.json()
        if(data.data[0].executed) {
          toast.success(`Successfully resolved payment request - ${data.data[0].transactionHash}`, {
            id: toastId
          })
        }
      }, 1000)
    
      return () => clearInterval(interval)
    }
  }, [requestId])

  const requestPayment = async () => {
    if(fetcchId) {
      if(fetcchId.split("@").length < 2) {
        toast.error("Wrong Fetcch ID")
        return
      } 
      
      const res = await fetch("https://sandbox-api.fetcch.xyz/v1/request/", {
        method: 'POST',
        body: JSON.stringify({
          "payer": fetcchId,
          "receiver": "wag@fetcch",
          "amount": ethers.utils.parseUnits(parityPrice.toString(), selected.decimals).toString(),
          "token": selected?.token,
          "chain": selected?.id,
          "message": message,
          "label": "Product Name3"
        }),
        headers: {
          'secret-key': "87e4153d-bfc2-4880-a034-d614f2626103",
          'content-type': 'application/json'
        }
      })

      const data = await res.json()

      setRequestId(data.data.id)

      const id = toast.loading("Checking payment request")

      setToastId(id)

      toast.success(`Successfully request ${parityPrice.toString()} ${selected.tokenName}`)
    } else {
      toast.error("Enter Fetcch ID first")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 bg-gray-50">
      <div className="fixed inset-0 overflow-hidden opacity-75 bg-[#f8fafb]">
        <Image
          alt="World Map"
          src={map}
          layout="fill"
          objectFit="cover"
          quality={100}
        />
      </div>
      <main className="flex flex-col items-center flex-1 px-4 sm:px-20 text-center z-10 sm:pt-10">
        <h1 className="text-3xl sm:text-5xl font-bold">Fetcch Payment Request Demo</h1>
        <p className="mt-4 sm:text-xl text-lg text-gray-700">
          Buy this using any cryptocurrency!!
        </p>
        <a
          className="flex items-center mt-4 text-md sm:text-lg text-blue-500 hover:underline"
          href="https://docs.fetcch.xyz"
          target="_blank"
          rel="noreferrer"
        >
          View Fetcch documentation
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="currentColor"
            className="ml-1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            shapeRendering="geometricPrecision"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </a>
        <div className="lg:h-[512px] lg:w-[512px] h-[320px] w-[320px] -mb-40 lg:-mb-56">
          <Image
            alt="Black shirt with white logo"
            src={shirt}
            placeholder="blur"
            layout="responsive"
          />
        </div>
        <section className="border border-gray-300 bg-white rounded-lg shadow-lg mt-16 w-full max-w-[480px] hover:shadow-2xl transition pt-16 lg:pt-24">
          <div className="p-4 flex flex-col justify-center items-center border-b">
            <div className="flex justify-between w-full items-baseline">
              <div className="ml-4 mr-auto text-left flex flex-col">
                <h4 className="font-semibold text-xl">Alpha Black shirt</h4>
                <h5 className="text-gray-700">Limited edition</h5>
              </div>
              <h4 className="font-bold text-lg">{selected.tokenName} {parityPrice}</h4>
            </div>
          </div>
          <div className="z-50 p-4 space-y-3 flex flex-col justify-center items-center border-b">
            <input value={fetcchId} onChange={(e) => setFetcchId(e.target.value)} className='w-full border p-3' placeholder='Your Fetcch ID' />
            <SelectDemo chains={chainsList} selected={selected} setSelected={setSelected} />
          </div>
          <div className="p-4 gap-4 flex flex-col justify-center items-center border-b">
            <button
              className="py-4 px-6 text-lg w-full bg-black text-white rounded-md hover:bg-gray-900"
              onClick={() =>
                requestPayment()
              }
            >
              Buy now
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

CountryPage.Layout = Layout

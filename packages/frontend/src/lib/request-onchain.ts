import 'server-only'
import { ethers } from 'ethers'
import { realEstateABI, weatherConsumerABI } from '@/config/contracts'
// import { Coordinates } from '@/types'

/* WEATHER REQUEST */

const getWeatherContract = () => {
  const provider = new ethers.JsonRpcProvider(process.env.NETWORK_RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider)
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS_METEO as string,
    weatherConsumerABI,
    signer,
  )
  return contract
}

export const getWeatherOnchain = async (requestId: string) => {
  const contract = getWeatherContract()
  const result = await contract.requests(requestId)
  
  if (!result.temperature) return
  
  return {
    temperature: result.temperature,
    timestamp: result.timestamp.toString(),
    latitude: result.lat,
    longitude: result.long,
  }
}

/* RWA REQUEST */
const getRealEstateContract = () => {
  const provider = new ethers.JsonRpcProvider(process.env.NETWORK_RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider)
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS_REAL_ESTATE as string,
    realEstateABI,
    signer,
  )
  return contract
}
export const getRealEstateOnChain = async (requestId: string) => {
  const contract = getRealEstateContract()
  const result = await contract.requests(requestId)

  if (!result.tokenId) return

  return {
    tokenId: result.tokenId,
    response: result.response.toString()
  }
}
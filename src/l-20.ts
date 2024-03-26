import { Address, BigInt, Bytes, log, store } from "@graphprotocol/graph-ts";
import {
  Transfer as TransferEvent,
} from "../generated/l20/l20"
import {
  Point
} from "../generated/schema"
export const ETHER_ONE = BigInt.fromString("1000000000000000000");
export const DENOMINATOR_number = 10000;
export const DENOMINATOR = BigInt.fromI32(DENOMINATOR_number);
export const LST_PRICE_MAP = new Map<string, BigInt>();
export const STETH = "0x7b1fcd81F8b91C5eF3743c4d56bf7C1E52c93360".toLowerCase();
export const METH = "0xB5B8C247C740d53b6Fbab10f1C17922788baeD54".toLowerCase();
export const WBETH = "0x7F62B7a0A9848D5e261960Ff4B4009206aD00bd5".toLowerCase();
export const SWETH = "0xBB68f4548A1c26B6611cbB8087c25A616eDd8569".toLowerCase();

LST_PRICE_MAP.set(STETH, DENOMINATOR);
LST_PRICE_MAP.set(METH, BigInt.fromI32(1024 * DENOMINATOR_number).div(BigInt.fromI32(1000)));
LST_PRICE_MAP.set(WBETH, BigInt.fromI32(1033 * DENOMINATOR_number).div(BigInt.fromI32(1000)));
LST_PRICE_MAP.set(SWETH, BigInt.fromI32(1053 * DENOMINATOR_number).div(BigInt.fromI32(1000)));

export const BIGINT_ZERO = BigInt.fromI32(0)
export const BIGINT_ONE = BigInt.fromI32(1)
export const BIGINT_TWO = BigInt.fromI32(2)
export const BYTES_ZERO = Bytes.fromI32(0)

export const ADDRESS_ZERO = Address.fromHexString("0x0000000000000000000000000000000000000000".toLowerCase())
export const ADDRESS_ZERO_BYTES = Bytes.fromHexString("0x0000000000000000000000000000000000000000".toLowerCase())

function toLowerCase(address: Bytes): Bytes {
  return Bytes.fromHexString(address.toHexString().toLowerCase());
}

export function handleTransfer(event: TransferEvent): void {
  const stakeToken = toLowerCase(event.address);
  const weight = LST_PRICE_MAP.get(stakeToken.toHexString().toLowerCase());
  const transferShares = event.params.value;
  const from = toLowerCase(event.params.from);
  const to = toLowerCase(event.params.to);
  const timestamp = event.block.timestamp;

  const weightTransferShares = transferShares.times(weight).div(DENOMINATOR);
  const increase = timestamp.times(weightTransferShares);
  // process for sender
  if (from.notEqual(ADDRESS_ZERO)) {
    // burn or transfer to others
    const point = loadOrCreatePoint(from);
    point.timeWeightAmountOut = point.timeWeightAmountOut.plus(increase);
    point.balance = point.balance.minus(weightTransferShares);
    point.save();
  }
  
  if (to.notEqual(ADDRESS_ZERO)) {
    // mint or receive token from others
    const point = loadOrCreatePoint(to);
    point.timeWeightAmountIn =  point.timeWeightAmountIn.plus(increase);
    point.balance = point.balance.plus(weightTransferShares);
    point.save();
  }

}

function loadOrCreatePoint(address: Bytes): Point {
  address = toLowerCase(address);
  let point = Point.load(address);

  if(!point){
    point = new Point(address);
    point.address = address;
    point.balance = BIGINT_ZERO;
    point.timeWeightAmountIn = BIGINT_ZERO;
    point.timeWeightAmountOut = BIGINT_ZERO;
    point.save();
  }
  return point;
}


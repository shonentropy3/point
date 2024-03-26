import {
  AdminChanged as AdminChangedEvent,
  Approval as ApprovalEvent,
  BeaconUpgraded as BeaconUpgradedEvent,
  BridgeBurn as BridgeBurnEvent,
  BridgeInitialize as BridgeInitializeEvent,
  BridgeMint as BridgeMintEvent,
  EIP712DomainChanged as EIP712DomainChangedEvent,
  Initialized as InitializedEvent,
  Transfer as TransferEvent,
  Upgraded as UpgradedEvent
} from "../generated/l20/l20"
import {
  AdminChanged,
  Approval,
  BeaconUpgraded,
  BridgeBurn,
  BridgeInitialize,
  BridgeMint,
  EIP712DomainChanged,
  Initialized,
  Transfer,
  Upgraded,
  Point,
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
LST_PRICE_MAP.set(METH, BigInt.fromI32(1.024 * DENOMINATOR_number));
LST_PRICE_MAP.set(WBETH, BigInt.fromI32(1.033 * DENOMINATOR_number));
LST_PRICE_MAP.set(SWETH, BigInt.fromI32(1.053 * DENOMINATOR_number));

export const BIGINT_ZERO = BigInt.fromI32(0)
export const BIGINT_ONE = BigInt.fromI32(1)
export const BIGINT_TWO = BigInt.fromI32(2)
export const BYTES_ZERO = Bytes.fromI32(0)

export const ADDRESS_ZERO = Address.fromHexString("0x0000000000000000000000000000000000000000".toLowerCase())
export const ADDRESS_ZERO_BYTES = Bytes.fromHexString("0x0000000000000000000000000000000000000000".toLowerCase())

function toLowerCase(address: Bytes): Bytes {
  return Bytes.fromHexString(address.toHexString().toLowerCase());
}

export function handleAdminChanged(event: AdminChangedEvent): void {
  let entity = new AdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousAdmin = event.params.previousAdmin
  entity.newAdmin = event.params.newAdmin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBeaconUpgraded(event: BeaconUpgradedEvent): void {
  let entity = new BeaconUpgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.beacon = event.params.beacon

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBridgeBurn(event: BridgeBurnEvent): void {
  let entity = new BridgeBurn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._account = event.params._account
  entity._amount = event.params._amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBridgeInitialize(event: BridgeInitializeEvent): void {
  let entity = new BridgeInitialize(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.l1Token = event.params.l1Token
  entity.name = event.params.name
  entity.symbol = event.params.symbol
  entity.decimals = event.params.decimals

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBridgeMint(event: BridgeMintEvent): void {
  let entity = new BridgeMint(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity._account = event.params._account
  entity._amount = event.params._amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleEIP712DomainChanged(
  event: EIP712DomainChangedEvent
): void {
  let entity = new EIP712DomainChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  const stakeToken = toLowerCase(event.address);
  const weight = LST_PRICE_MAP.get(stakeToken.toHexString().toLowerCase());
  const transferShares = event.params.value;
  const from = toLowerCase(event.params.from);
  const to = toLowerCase(event.params.to);
  const timestamp = BigInt.fromI32(event.block.timestamp);

  const weightTransferShares = transferShares.mul(weight).div(DENOMINATOR);
  const increase = timestamp.mul(weightTransferShares);
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


export function handleUpgraded(event: UpgradedEvent): void {
  let entity = new Upgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.implementation = event.params.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

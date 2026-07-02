// Minimal ABIs for the on-chain bid + claim path. Source-verified (github sunrisedotdev/sonar@main):
// SettlementSale.sol - replaceBidWithPermit l.599, claimRefund l.990, entityStatesByIDs l.1224,
// Bid l.274, paymentTokens l.305, stage/claimRefundEnabled; PurchasePermitV3.sol l.20-32;
// interfaces/types.sol TokenAmount. Inlined as one `as const` so viem infers arg/return types.
// Fully re-verify against the deployed bytecode (Etherscan or scripts/probe-sale.mjs) before mainnet.

export const settlementSaleAbi = [
  {
    type: "function",
    name: "replaceBidWithPermit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      {
        name: "bid",
        type: "tuple",
        components: [
          { name: "lockup", type: "bool" },
          { name: "price", type: "uint64" },
          { name: "amount", type: "uint256" },
        ],
      },
      {
        name: "purchasePermit",
        type: "tuple",
        components: [
          { name: "saleSpecificEntityID", type: "bytes16" },
          { name: "saleUUID", type: "bytes16" },
          { name: "wallet", type: "address" },
          { name: "expiresAt", type: "uint64" },
          { name: "minAmount", type: "uint256" },
          { name: "maxAmount", type: "uint256" },
          { name: "minPrice", type: "uint64" },
          { name: "maxPrice", type: "uint64" },
          { name: "opensAt", type: "uint64" },
          { name: "closesAt", type: "uint64" },
          { name: "payload", type: "bytes" },
        ],
      },
      { name: "purchasePermitSignature", type: "bytes" },
      { name: "erc20PermitDeadline", type: "uint256" },
      { name: "erc20PermitSignature", type: "bytes" },
    ],
    outputs: [],
  },
  // Non-permit entry point (SettlementSale.sol): same bid, funded by a prior ERC-20 approval
  // covering the amount delta - the path for tokens without EIP-2612 (mainnet USDT).
  {
    type: "function",
    name: "replaceBidWithApproval",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      {
        name: "bid",
        type: "tuple",
        components: [
          { name: "lockup", type: "bool" },
          { name: "price", type: "uint64" },
          { name: "amount", type: "uint256" },
        ],
      },
      {
        name: "purchasePermit",
        type: "tuple",
        components: [
          { name: "saleSpecificEntityID", type: "bytes16" },
          { name: "saleUUID", type: "bytes16" },
          { name: "wallet", type: "address" },
          { name: "expiresAt", type: "uint64" },
          { name: "minAmount", type: "uint256" },
          { name: "maxAmount", type: "uint256" },
          { name: "minPrice", type: "uint64" },
          { name: "maxPrice", type: "uint64" },
          { name: "opensAt", type: "uint64" },
          { name: "closesAt", type: "uint64" },
          { name: "payload", type: "bytes" },
        ],
      },
      { name: "purchasePermitSignature", type: "bytes" },
    ],
    outputs: [],
  },
  { type: "function", name: "claimRefund", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "function",
    name: "stage",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "claimRefundEnabled",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "paymentTokens",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "entityStatesByIDs",
    stateMutability: "view",
    inputs: [{ name: "entityIDs", type: "bytes16[]" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "entityID", type: "bytes16" },
          { name: "bidTimestamp", type: "uint32" },
          { name: "refunded", type: "bool" },
          {
            name: "currentBid",
            type: "tuple",
            components: [
              { name: "lockup", type: "bool" },
              { name: "price", type: "uint64" },
              { name: "amount", type: "uint256" },
            ],
          },
          {
            name: "walletStates",
            type: "tuple[]",
            components: [
              { name: "addr", type: "address" },
              { name: "entityID", type: "bytes16" },
              {
                name: "committedAmountByToken",
                type: "tuple[]",
                components: [
                  { name: "token", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
              },
              {
                name: "cancelledAmountByToken",
                type: "tuple[]",
                components: [
                  { name: "token", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
              },
              {
                name: "acceptedAmountByToken",
                type: "tuple[]",
                components: [
                  { name: "token", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  // Custom errors we surface to the user (lets viem decode the revert name).
  { type: "error", name: "BidMustHaveLockup", inputs: [] },
  {
    type: "error",
    name: "BidPriceBelowMinPrice",
    inputs: [
      { name: "price", type: "uint256" },
      { name: "min", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "BidPriceExceedsMaxPrice",
    inputs: [
      { name: "price", type: "uint256" },
      { name: "max", type: "uint256" },
    ],
  },
  // maxAmount==0 is a LITERAL cap on-chain (no "unlimited" special case) - the sale must set a max.
  { type: "error", name: "BidBelowMinAmount", inputs: [{ type: "uint256" }, { type: "uint256" }] },
  {
    type: "error",
    name: "BidExceedsMaxAmount",
    inputs: [{ type: "uint256" }, { type: "uint256" }],
  },
  {
    type: "error",
    name: "BidPriceCannotBeLowered",
    inputs: [{ type: "uint256" }, { type: "uint256" }],
  },
  {
    type: "error",
    name: "BidAmountCannotBeLowered",
    inputs: [{ type: "uint256" }, { type: "uint256" }],
  },
  { type: "error", name: "BidLockupCannotBeUndone", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] },
  { type: "error", name: "SalePaused", inputs: [] },
  {
    type: "error",
    name: "PurchasePermitExpired",
    inputs: [{ type: "uint256" }, { type: "uint256" }],
  },
  {
    type: "error",
    name: "BidOutsideAllowedWindow",
    inputs: [{ type: "uint64" }, { type: "uint64" }, { type: "uint256" }],
  },
  { type: "error", name: "InvalidSender", inputs: [{ type: "address" }, { type: "address" }] },
  { type: "error", name: "UnauthorizedSigner", inputs: [{ type: "address" }] },
  { type: "error", name: "InvalidPaymentToken", inputs: [{ type: "address" }] },
  {
    type: "error",
    name: "WalletNotAssociatedWithEntity",
    inputs: [{ type: "address" }, { type: "bytes16" }],
  },
  { type: "error", name: "EntityNotInitialized", inputs: [{ type: "bytes16" }] },
  { type: "error", name: "WalletNotInitialized", inputs: [{ type: "address" }] },
  { type: "error", name: "InvalidSaleUUID", inputs: [{ type: "bytes16" }, { type: "bytes16" }] },
] as const

// ERC-20 + EIP-2612 reads needed to build the USDC permit (name/version -> domain, nonces -> message).
export const erc20Abi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "version",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const

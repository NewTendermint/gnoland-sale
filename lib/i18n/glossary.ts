/**
 * KO translation glossary - the single source of truth for how recurring product/finance terms
 * are rendered in Korean, so copy stays consistent across every section. This is a REFERENCE map
 * for translators and reviewers; it is not imported by the render path. Korean drafts in
 * messages/ko.json must follow these choices. Proper nouns (GNOT, Gno.land, Cosmos, Tendermint,
 * NewTendermint, Sonar, USDC, USDT, Adena) stay in Latin script.
 *
 * Draft status: the Korean side is a first pass authored in-house and MUST be reviewed by a native
 * Korean speaker before launch. Legal documents (Terms/Privacy/Disclaimer) are intentionally NOT
 * translated - the English versions are authoritative (Terms 18.14).
 */
export const KO_GLOSSARY: Record<string, string> = {
  "public sale": "퍼블릭 세일",
  "token sale": "토큰 세일",
  auction: "경매",
  "uniform price auction": "단일가 경매",
  "clearing price": "체결가",
  bid: "입찰",
  "place a bid": "입찰하기",
  "raise your bid": "입찰가 인상",
  commitment: "약정 금액",
  allocation: "배정 물량",
  refund: "환불",
  outbid: "입찰 초과",
  winning: "낙찰 중",
  pending: "대기 중",
  verification: "본인 인증",
  KYC: "본인 인증(KYC)",
  wallet: "지갑",
  "connect your wallet": "지갑 연결",
  network: "네트워크",
  permit: "퍼밋(permit)",
  tokenomics: "토큰이코노미",
  vesting: "베스팅",
  lockup: "락업",
  cliff: "클리프",
  "circulating supply": "유통 공급량",
  "total supply": "총 공급량",
  TGE: "TGE(토큰 생성 시점)",
  mainnet: "메인넷",
  roadmap: "로드맵",
  ecosystem: "에코시스템",
  "smart contract": "스마트 컨트랙트",
  blockchain: "블록체인",
  developer: "개발자",
}

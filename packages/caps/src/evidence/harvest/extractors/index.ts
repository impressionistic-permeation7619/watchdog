import { claimsExtractor } from "./claims";
import { cryptoExtractor } from "./crypto";
import {
  darknetExtractor,
  pastesExtractor,
  p2pExtractor,
} from "./darknet-pastes-p2p";
import { emailsExtractor, urlsExtractor } from "./emails-urls";
import { fediverseExtractor, matrixExtractor } from "./fediverse-matrix";
import { handlesExtractor } from "./handles";
import { historicalMessengersExtractor } from "./historical-messengers";
import { modernMessengersExtractor } from "./modern-messengers";
import {
  pgpExtractor,
  publicIpv4Extractor,
  toxExtractor,
} from "./pgp-tox-ipv4";
import { phonesExtractor } from "./phones";
import { quotesExtractor } from "./quotes";
import { searchableSelectorsExtractor } from "./searchable-selectors";
import type { HarvestExtractor } from "./types";
import { uriSchemesExtractor } from "./uri-schemes";

export type { HarvestExtractor } from "./types";

export const HARVEST_EXTRACTORS: HarvestExtractor[] = [
  quotesExtractor,
  fediverseExtractor,
  matrixExtractor,
  emailsExtractor,
  urlsExtractor,
  darknetExtractor,
  pastesExtractor,
  p2pExtractor,
  uriSchemesExtractor,
  modernMessengersExtractor,
  cryptoExtractor,
  pgpExtractor,
  toxExtractor,
  publicIpv4Extractor,
  historicalMessengersExtractor,
  phonesExtractor,
  handlesExtractor,
  claimsExtractor,
  searchableSelectorsExtractor,
];

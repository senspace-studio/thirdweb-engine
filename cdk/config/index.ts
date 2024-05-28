export interface Config {
  stage: string;

  serviceName: string;

  aws: {
    accountId: string;
    region: string;
  };

  dbSecretSuffix: string;

  thirdwebAPISecretKey: string;
  thirdwebEngineEncryptionPassword: string;
}

export function getConfig(stage: string): Config {
  return require(`./${stage}.json`);
}

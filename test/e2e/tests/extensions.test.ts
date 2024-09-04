import assert from "assert";
import { sleep } from "bun";
import { describe, expect, test } from "bun:test";
import { erc721Abi, getAddress, type Address } from "viem";
import { CONFIG } from "../config";
import { setup } from "./setup";

describe("Extensions", () => {
  let nftContractAddress: Address | undefined;

  test("Deploy ERC721 Contract", async () => {
    const { engine, backendWallet } = await setup();

    const res = await engine.deploy.deployNftCollection(
      CONFIG.CHAIN.id.toString(),
      backendWallet,
      {
        contractMetadata: {
          name: "Test NFT",
          symbol: "TNFT",
          fee_recipient: backendWallet,
          platform_fee_basis_points: 0,
          platform_fee_recipient: backendWallet,
          seller_fee_basis_points: 0,
          trusted_forwarders: [],
        },
      },
    );

    nftContractAddress = res.result.deployedAddress
      ? getAddress(res.result.deployedAddress)
      : undefined;

    let mined = false;

    while (!mined) {
      const statusRes = await engine.transaction.status(res.result.queueId!);
      mined = statusRes.result.status === "mined";
      await sleep(1000);
    }

    expect(nftContractAddress).toBeDefined();
    console.log("NFT Contract Address:", nftContractAddress);
  });

  test("Mint NFT", async () => {
    const { engine, testClient, publicClient, backendWallet } = await setup();

    expect(nftContractAddress).toBeDefined();
    assert(nftContractAddress, "NFT contract address is not defined");

    const res = await engine.erc721.mintTo(
      CONFIG.CHAIN.id.toString(),
      nftContractAddress,
      backendWallet,
      {
        receiver: backendWallet,
        metadata: {
          name: "My NFT",
          description: "My NFT description",
          image:
            "ipfs://QmciR3WLJsf2BgzTSjbG5zCxsrEQ8PqsHK7JWGWsDSNo46/nft.png",
        },
      },
    );

    expect(res.result.queueId).toBeDefined();

    let mined = false;
    while (!mined) {
      const status = await engine.transaction.status(res.result.queueId!);
      mined = !!status.result.minedAt;
      await sleep(1000);
    }

    const engineBalanceOfBackendWallet = await engine.erc721.balanceOf(
      backendWallet,
      CONFIG.CHAIN.id.toString(),
      nftContractAddress,
    );

    const viemBalanceOfBackendWallet = await publicClient.readContract({
      abi: erc721Abi,
      address: nftContractAddress,
      functionName: "balanceOf",
      args: [backendWallet],
    });

    expect(engineBalanceOfBackendWallet.result).toEqual("1");
    expect(viemBalanceOfBackendWallet).toEqual(1n);
  });
});
import { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";
import { Static, Type } from "@sinclair/typebox";
import { getContractInstance } from "../../../../../../core/index";
import {
  contractParamSchema,
  standardResponseSchema,
  transactionWritesResponseSchema,
} from "../../../../../helpers/sharedApiSchemas";
import { queueTransaction } from "../../../../../helpers";
import { signature20OutputSchema } from "../../../../../schemas/erc20";
import {
  PayloadToSign20,
  SignedPayload20,
  SignedPayload721WithQuantitySignature,
} from "@thirdweb-dev/sdk";
import { BigNumber } from "ethers";

// INPUTS
const requestSchema = contractParamSchema;
const requestBodySchema = Type.Object({
  payload: signature20OutputSchema,
  signature: Type.String(),
});

requestBodySchema.examples = [
  {
    payload: {},
    signature: "",
  },
];

export async function erc20SignatureMint(fastify: FastifyInstance) {
  fastify.route<{
    Params: Static<typeof requestSchema>;
    Reply: Static<typeof transactionWritesResponseSchema>;
    Body: Static<typeof requestBodySchema>;
  }>({
    method: "POST",
    url: "/contract/:network/:contract_address/erc20/signature/mint",
    schema: {
      description: "Mint tokens from a previously generated signature.",
      tags: ["ERC20"],
      operationId: "erc20_signature_mint",
      params: requestSchema,
      body: requestBodySchema,
      response: {
        ...standardResponseSchema,
        [StatusCodes.OK]: transactionWritesResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { network, contract_address } = request.params;
      const { payload, signature } = request.body;
      const contract = await getContractInstance(network, contract_address);

      const signedPayload: SignedPayload20 = {
        payload: {
          ...payload,
          quantity: BigNumber.from(payload.quantity).toString(),
          mintStartTime: BigNumber.from(payload.mintStartTime),
          mintEndTime: BigNumber.from(payload.mintEndTime),
        },
        signature,
      };
      const tx = await contract.erc20.signature.mint.prepare(signedPayload);
      const queuedId = await queueTransaction(request, tx, network, "erc721");
      reply.status(StatusCodes.OK).send({
        result: queuedId,
      });
    },
  });
}
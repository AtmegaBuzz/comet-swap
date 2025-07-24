import { connect, createDataItemSigner } from "@permaweb/aoconnect";
import { formatTokenBalance, unformatTokenBalance } from "../utils";
import { useToast } from "./useToast";

function useAo() {

    const { result, results, message, spawn, monitor, unmonitor, dryrun } = connect({ MODE: "legacy", CU_URL: "https://cu.arnode.asia" });
    const toast = useToast();


    const getwUSDCBalance = async (address: string): Promise<string> => {
        const result = await dryrun({
            process: 'kUVaTPKz3qI-o4FblwxRXs1ZXSSobJDjVqxApHgt7fA',
            tags: [
                { name: 'Action', value: 'Balance' },
                { name: 'Recipient', value: address }
            ],
        });
        const balance = result.Messages[0].Data as string;
        return formatTokenBalance(balance, 6);
    }

    const swapTokens = async (wUSDCAmount: string) => {
        await message({
            process: "kUVaTPKz3qI-o4FblwxRXs1ZXSSobJDjVqxApHgt7fA",
            tags: [
                { name: 'Action', value: 'Transfer' },
                { name: 'Recipient', value: 'pD8Hy5x8sweEfLJAvpGhbubYqA2qXqGL0xKyScKLyMk' },
                { name: 'Quantity', value: unformatTokenBalance(wUSDCAmount, 6) },
            ],
            signer: createDataItemSigner(window.arweaveWallet)
        })

        toast.showTxSent()
    }

    const fetchOrders = async (address: string) => {

        try {
            const result = await dryrun({
                process: 'pD8Hy5x8sweEfLJAvpGhbubYqA2qXqGL0xKyScKLyMk',
                tags: [
                    { name: 'Action', value: 'Fetch-Orders' },
                    { name: 'Recipient', value: address }
                ],
            });
            const orders = result.Messages[0].Data as string;
            console.log("Fetched orders:", orders);
            return (JSON.parse(orders) as []).reverse();

        } catch (error) {
            console.log("Error fetching orders:", error);
            return [];
        }

    }


    return {
        result,
        results,
        message,
        spawn,
        monitor,
        unmonitor,
        dryrun,
        getwUSDCBalance,
        swapTokens,
        fetchOrders
    };
}


export default useAo;
-- Define types
global record Order
  id: string
  quantity: string
  fulfilled: boolean
end

global record Message
  Id: string
  From: string
  Sender: string
  Data: string
  Tags: {string:string}
end

-- Global variables
global ASTRO_PROCESS_ID: string = "xRQPYNhFZgTi3VRSprtqtszCuF3_JFBw-bdgJG7aUsQ"
global WUSDC_PROCESS_ID: string = "kUVaTPKz3qI-o4FblwxRXs1ZXSSobJDjVqxApHgt7fA"

global orders: {string: {Order}} = {}

-- Convert wUSDC to USDA (6 → 12 decimals)
local function convert_wusdc_to_usda(amount_wusdc: number): integer
    local DECIMALS_WUSDC: integer = 6
    local DECIMALS_USDA: integer = 12

    local scale_factor: number = 10 ^ (DECIMALS_USDA - DECIMALS_WUSDC)
    return math.floor(amount_wusdc * scale_factor + 0.5) -- rounds to nearest integer
end

local function swapOrder(msg: Message)
    -- Check if the message is from the correct process
    if msg.From ~= WUSDC_PROCESS_ID then
        return
    end

    if not orders[msg.Sender] then
        orders[msg.Sender] = {}
    end

    -- Order Creation
    local new_order: Order = {
        id = msg.Id,
        quantity = msg.Tags.Quantity,
        fulfilled = false
    }

    table.insert(orders[msg.Sender], new_order)

    ao.send({
        Target = msg.Sender,
        Action = "Order-Created",
        OrderId = msg.Id,
        Quantity = msg.Tags.Quantity,
        Fulfilled = "false"  -- Changed to string since ao.send expects strings
    })

    -- Order Fulfillment
    local amount_usda: integer = convert_wusdc_to_usda(tonumber(msg.Tags.Quantity))

    ao.send({
        Target = ASTRO_PROCESS_ID,
        Action = "Mint",
        Recipient = msg.Sender,
        Quantity = tostring(amount_usda)
    })
    print("Successfully minted " .. tostring(amount_usda))
    Receive({ })

    -- Mark order as fulfilled
    for _, order in ipairs(orders[msg.Sender]) do
        if order.id == msg.Id then
            order.fulfilled = true
            break
        end
    end

    ao.send({
        Target = msg.Sender,
        Action = "Order-Fulfilled",
        OrderId = msg.Id,
        Quantity = msg.Tags.Quantity
    })
end

local function retrySwapOrder(msg: Message)
    if not orders[msg.Sender] then
        return
    end

    for _, order in ipairs(orders[msg.Sender]) do
        if order.id == msg.Data and not order.fulfilled then
            local amount_usda: integer = convert_wusdc_to_usda(tonumber(order.quantity))
            
            ao.send({
                Target = ASTRO_PROCESS_ID,
                Action = "Transfer",
                Recipient = msg.Sender,
                Quantity = tostring(amount_usda)
            })

            ao.send({
                Target = msg.Sender,
                Action = "Order-Fulfilled",
                OrderId = order.id,
                Quantity = order.quantity
            })

            order.fulfilled = true
            break
        end
    end
end

local function withdrawOrder(msg: Message)
    if not orders[msg.Sender] then
        return
    end

    for _, order in ipairs(orders[msg.Sender]) do
        if order.id == msg.Data and not order.fulfilled then

            ao.send({
                Target = WUSDC_PROCESS_ID,
                Action = "Transfer",
                Recipient = msg.Sender,
                Quantity = order.quantity
            })

            Receive({ Action = "Debit-Notice", Recipient = msg.Sender })
            ao.send({
                Target = msg.Sender,
                Action = "Order-Withdrawn",
                OrderId = order.id,
                Quantity = order.quantity
            })

            order.fulfilled = true
            
            return
        end
    end

    ao.send({
        Target = msg.Sender,
        Action = "Order-Not-Found",
        Reason = "Order does not exist or has already been fulfilled."
    })
end

-- Add handlers
Handlers.add('Credit-Notice', Handlers.utils.hasMatchingTag('Action', 'Credit-Notice'), swapOrder)
Handlers.add('Retry-Swap-Order', Handlers.utils.hasMatchingTag('Action', 'Retry-Swap-Order'), retrySwapOrder)
Handlers.add('Withdraw-Order', Handlers.utils.hasMatchingTag('Action', 'Withdraw-Order'), withdrawOrder)
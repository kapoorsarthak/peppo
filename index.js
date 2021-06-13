async function Payment(req,res) {
    const handlerInfo = {
        apiModule: 'Payment',
        apiHandler: 'Payment'
    };

    const body          = req.body;
    logging.trace(handlerInfo, {REQUEST: body});

    const accessToken   = body.access_token;
    const quantity      = body.quantity;
    const amount        = body.amount;
    const currency      = body.currency;
    const itemId        = body.itemId;
    const status        = body.trasaction_status;

    const checkBlankFields = [accessToken, quantity, amount, currency, itemId];
    if (checkBlank(checkBlankFields)) {
        response = {
            flag: PARAMETER_MISSING,
            message: PARAMETER_MISSING
        };
        return res.send(response);
    }

    try {
        const user = await fetchUser(handlerInfo, accessToken);
        if (!user) {
            throw new Error(`no_user`);
        }

        if(status == TXN_STATUS.SUCCESS) {
            await updateTransaction(handlerInfo, quantity, amount, currency, itemId, status);

            let response = {
                flag: TRANSACTION_SUCCESS,
                item_id: itemId,
                amount_deducted: amount,
                message: "TRANSACTION_SUCCESS"
            };

            return res.send(response);
        }

        if(status == TXN_STATUS.FAILED){
            await updateTransaction(handlerInfo, quantity, amount, currency, itemId, status);
            
            let response = {
                flag: TRANSACTION_FAILED,
                item_id: itemId,
                amount_deducted: amount,
                message: "TRANSACTION_FAILED"
            };

            return res.send(response);
        }

        if(status == TXN_STATUS.PENDIND){
            throw new Error(`Please try again later as the trasaction is under process`);
        }
    }
    catch(error) {
        logging.error(handlerInfo, {ERROR: error.stack});
        sendErrorResponse(handlerInfo, error, req, res);
    }

    async function updateTransaction(handlerInfo, quantity, amount, currency, itemId, status){
        const stmt = `UPDATE 
                        tb_trasancion
                    SET 
                        status = ?
                    WHERE 
                        quantity = ?
                        AND amount= ?
                        AND currency = ?
                        AND itemId  = ?
                    `

        const values = [status, quantity, amount, currency, itemId];

        const queryObj =  {
            query: stmt,
            args: values,
            event: ' updating trasaction details '
        };

        return db.executeQuery(handlerInfo, queryObj);
    }
    
    async function fetchUser(handlerInfo, accessToken){
        const stmt = `SELECT 
                            * 
                        FROM 
                            tb_users
                        WHERE access_token = ? `;

        const values = [accessToken];

        const queryObj =  {
            query: stmt,
            args:   values,
            event: ' fetching user details '
        };

        return db.executeQuery(handlerInfo, queryObj);
    }
}
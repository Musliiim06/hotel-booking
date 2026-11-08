const experss = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const db = require("./db");


dotenv.config();
const app = experss();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
app.use(cors({ origin: process.env.CLIENT_URL }));

app.post("/webhook", experss.raw({ type: "application/json" }), async (req, res) => {
    let event;
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        const signature = req.headers["stripe-signature"];
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.sendStatus(400);
        }
    }

    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object;
            console.log("Payment successful!", session);
            break;
        case "checkout.session.async_payment_succeeded":
            const asyncSession = event.data.object;
            console.log("Async payment succeeded!", asyncSession);
            break;
        case "checkout.session.async_payment_failed":
            const failedSession = event.data.object;
            console.log("Async payment failed!", failedSession);
            break;
        case "checkout.session.expired":
            const expiredSession = event.data.object;
            console.log("Checkout session expired!", expiredSession);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
        
    }
    res.json({ received: true });



})










app.use(experss.json());

async function findfreeRooms(startDate, endDate) {
     const result = await db.query(
        `SELECT r.title, r.room_type, r.price_per_night, r.capacity, count(*) as available_count
         FROM rooms r
         WHERE r.is_active = TRUE
         
         AND NOT EXISTS (
             SELECT 1
             FROM bookings b
             WHERE b.room_id = r.id
             AND b.check_in < $2
             AND b.check_out > $1
             AND b.status <> 'cancelled'
         )
        group by r.title, r.title, r.room_type, r.price_per_night, r.capacity`,
        [startDate, endDate]
    );
    return result.rows;
}


async function createBooking(startDate, endDate, rooms) {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const createdBookings = [];

        for (const selected of rooms) {

            const quantity = Number(selected.quantity);

            if (!Number.isInteger(quantity) || quantity < 1) {
                throw new Error("Invalid room quantity");
            }

            
            const result = await client.query(
                `SELECT *
                 FROM rooms r
                 WHERE r.is_active = TRUE
                   AND r.room_type = $1

                   AND NOT EXISTS (
                       SELECT 1
                       FROM bookings b
                       WHERE b.room_id = r.id
                         AND b.check_in < $3
                         AND b.check_out > $2
                         AND b.status <> 'cancelled'
                   )

                 ORDER BY r.id
                 LIMIT $4
                 FOR UPDATE SKIP LOCKED`,
                [
                    selected.room_type,
                    startDate,
                    endDate,
                    quantity
                ]
            );

            
            if (result.rows.length < quantity) {
                throw new Error(
                    `Not enough available rooms: ${selected.room_type}`
                );
            }
           
            
            for (const room of result.rows) {
                const days = (new Date(endDate) - new Date(startDate))/ (1000 * 60 * 60 * 24);
                const totalPrice = (Number(room.price_per_night) * days).toFixed(2);

                const booking = await client.query(
                    `INSERT INTO bookings
                        (room_id, check_in, check_out, total_price)
                     VALUES ($1, $2, $3, $4)
                     RETURNING room_id, check_in, check_out, total_price`,
                    [room.id, startDate, endDate, totalPrice]
                );

                createdBookings.push(booking.rows[0]);
            }
        }

        await client.query("COMMIT");

        return createdBookings;

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}

async function createUser(user) {
    const { email, full_name, phone } = user;
    if (!full_name || !email || !phone) {
        throw new Error("Missing required fields");
    }
    if (!email.includes("@")) {
        throw new Error("Invalid email format");
    }
    // if (!/^\d{10}$/.test(phone)) {
    //     throw new Error("Invalid phone format");
    // }

    const result = await db.query(
        `INSERT INTO users (full_name, email, phone)
         VALUES ($1, $2, $3)
         RETURNING full_name, email, phone`,
        [full_name, email, phone]
    );
    if (result.rows.length === 0) {
        return { full_name, email, phone, message: "User already exists" };
        
    }
    return result.rows[0];
}


app.get("/api/available-rooms", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;


        if (!startDate || !endDate) {
            return res.status(400).json({ error: "Start date and end date are required" });
        }
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ error: "Start date must be before end date" });
        }
        const freeRooms = await findfreeRooms(startDate, endDate);
        res.status(200).json(freeRooms);

    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
})

//API to creste checout session
app.post("/api/create-checkout-session", async (req, res) => {

    const { user, startDate, endDate, rooms } = req.body;

    if (!user || !startDate || !endDate || !rooms || rooms.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ error: "Start date must be before end date" });
    }

    try{
        const createuser = await createUser(user);
        const createbooking = await createBooking(startDate, endDate, rooms);

        // res.json({ createuser, createbooking });


        const totalPrice = Object.values(createbooking).reduce((total, booking) => total + Number(booking.total_price), 0);


         const session = await stripe.checkout.sessions.create({
            
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Booking from ${startDate} to ${endDate}`,
                        },
                        unit_amount: Math.round(totalPrice * 100), 
                    },
                    quantity: 1,
                    }
                ],
                mode: "payment",
                success_url: `${process.env.CLIENT_URL}/success`,
                cancel_url: `${process.env.CLIENT_URL}/cancel`,
         
                })

         res.json({url: session.url,
            createbooking,
            createuser
         });


    } catch (error) {
        res.status(500).json({error: error.message});
    }
})




app.post("/api/create-checkout-session/v2", async (req, res) => {
    try {
        const { user, startDate, endDate, rooms } = req.body;
        // const createuser = await createUser(user);
        const createbooking = await createBooking(startDate, endDate, rooms);

        res.status(200).json({createbooking});
    }catch (error) {
        res.status(500).json({error: error.message});
    }
})






app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})
app
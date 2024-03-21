const sdk = require("api")("@pplx/v0#29jnn2rlt35the2");

sdk.auth(process.env.PPLX_API_KEY);
sdk.post_chat_completions({
    model: "sonar-medium-online",
    messages: [
        { role: "system", content: "Be precise and concise." },
        { role: "user", content: "How many stars are there in our galaxy?" },
    ],
})
    .then((data: any) => console.log(data.data.choices))
    .catch((err: any) => console.error(err));

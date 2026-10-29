// Ambiente de DEV: previews da Vercel (branch develop, dev.meeplepay.com.br) -> back DEV no Render.
export const environment = {
  production: false,
  apiUrl: 'https://meeplepayback-dev.onrender.com/api',
  // Pagamento da comanda encerrada; sem chave, o cliente é orientado a pedi-la no caixa
  pix: {
    chave: 'angatujogos@gmail.com',
    favorecido: 'Gustavo Valadão',
  },
};

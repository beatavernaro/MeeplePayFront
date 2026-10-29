export const environment = {
  production: true,
  apiUrl: 'https://api.meeplepay.com.br/api',
  // Pagamento da comanda encerrada; sem chave, o cliente é orientado a pedi-la no caixa
  pix: {
    chave: 'angatujogos@gmail.com',
    favorecido: 'Gustavo Valadão',
  },
};
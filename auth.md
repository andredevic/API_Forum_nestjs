hs256
rs256 (chave privada e publica)


no contexto de servicos como microsservicos um servico sera responsavel por auth e outro por notify por exemplo, usando o hs256 teriamos que replicar a secret para o notify verificar se aquele usuario esta autenticado porem se usarmos o rs256 podemos deixar a chave privada no servico de auth e apenas usar chaves publicas em outros servicos e assim os servicos saberao se o usuario esta autenticado pela chave publica ja que ela foi criada a partir da chave privada sendo melhor para checagem
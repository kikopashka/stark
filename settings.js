export class general{
    static delayAfterTxMin = 10
    static delayAfterTxMax = 20
    static delayAfterProjectMin = 10
    static delayAfterProjectMax = 100
    static provider = "https://ethereum.publicnode.com"
    static providerARB = "https://arbitrum.llamarpc.com"
    static gwei = 35
}


export class starkgate{
    static mode = false
    static procentForBridgeMin = 20
    static procentForBridgeMax = 20

}

export class argentGenerate{
    static mode = false                    //Если true, то функция будет работать, если false, то не будет
    static number_for_generate = 5         //Количество генерируемых кошельков
}

export class argentDeployWallet{
    static mode = false                    //Если true, то функция будет работать, если false, то не будет   
    static delayMin = 10
    static delayMax = 100
}

export class orbiter{
    static mode = true                    //Если true, то функция будет работать, если false, то не будет 
    static fromNetwork = "arbitrum"        //Из какой сети EVM отправляем (Доступен только arbitrum пока)
    static procentForBridge = 50           //Процент от баланса MM, который отправляем
    static delayMin = 10                   //Минимальная задержка после деплоя
    static delayMax = 20                   //Максимальная задержка после деплоя (выбирается рандомно между мин:мах)
} 





export class jediswap{
    static mode = false                     //Если true, то функция будет работать, если false, то не будет 
    static tokenIn = "ETH"                 //Какой токен бриджим свапаем в первом(!) свапе
    static swap_number_min = 2
    static swap_number_max = 4           //Количество свапов на этом DEX
    static procent_first_swap_min = 60     //Минимальный % для первого свапа ETH
    static procent_first_swap_max = 80     //Максимальный % для первого свапа ЕТН
}

export class myswap{
    static mode = false
    static tokenIn = "ETH"
    static swap_number_min = 3
    static swap_number_max = 4
    static procent_first_swap_min = 40
    static procent_first_swap_max = 40

}

export class kswap{
    static mode = false
    static tokenIn = "ETH"
    static swap_number_min = 1
    static swap_number_max = 1
    static procent_first_swap_min = 60
    static procent_first_swap_max = 70
}

export class avnu{
    static mode = false
    static tokenIn = "ETH"
    static swap_number_min = 1
    static swap_number_max = 1
    static procent_first_swap_min = 60
    static procent_first_swap_max = 70
}

export class starkkVerse{
    static mode = false   
    static mintsMin = 1
    static mintsMax = 5
}

export class dmailClass{
    static mode = false
    static emailToSendMin = 1          //минимальное количество писем
    static emailToSendMax = 3           //максимальное количество писем
   // static delayMin = 10                 //минимальная задержка 
   // static delayMax = 100                //максимальная задержка
}

export class jediLP{
    static mode = false
    static procentMin = 30                  //минимальный % ETH, который будет отправлен в LP
    static procentMax = 65                  //максимальный % ЕТН, который будет отправлен в LP
}

export class zkLendClass{
    static mode = false                      
    static borrow = false                   //Если true, то будет ещё занимать/выплачивать
    //static tokenDepsit = "ETH"              //Токен для использования на zkLend
    static procentMin = 15                  //минимальный процент от баланса токена для депозита
    static procentMax = 45                  //максимальный процент от баланса токена для депозита
    
}






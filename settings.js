import { getRandomNumber} from "./helper.js";
//Чтобы поставить рандомизацию на mode у проекта, пишем в строку - "random".
//"random" не работает у starkgate, argentGenerate, argentDeployWallet, orbiter

export class general{
    static delayAfterTxMin = 10           //МИНИМУМ 100!!!
    static delayAfterTxMax = 20
    static delayAfterProjectMin = 10
    static delayAfterProjectMax = 100
    static provider = "https://eth.llamarpc.com"
    static providerARB = "https://arbitrum.llamarpc.com"
    static gweiL1 = 20                               //gwei L1 при котром будут работать функции связанные с EVM сетями
    static gwei = 35                                 //gwei старка при котором будут работать функции старка
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
    static mode = false                    //Если true, то функция будет работать, если false, то не будет 
    static fromNetwork = "arbitrum"        //Из какой сети EVM отправляем (Доступен только arbitrum пока)
    static procentForBridge = 50           //Процент от баланса MM, который отправляем
    static delayMin = 10                   //Минимальная задержка после деплоя
    static delayMax = 20                   //Максимальная задержка после деплоя (выбирается рандомно между мин:мах)
} 





export class jediswap{
    static mode = "random"                     //Если true, то функция будет работать, если false, то не будет 
    static tokenIn = "ETH"                 //Какой токен бриджим свапаем в первом(!) свапе
    static swap_number_min = 2
    static swap_number_max = 4           //Количество свапов на этом DEX
    static procent_first_swap_min = 60     //Минимальный % для первого свапа ETH
    static procent_first_swap_max = 80     //Максимальный % для первого свапа ЕТН
}

export class myswap{
    static mode = "random"
    static tokenIn = "ETH"
    static swap_number_min = 1
    static swap_number_max = 3
    static procent_first_swap_min = 40
    static procent_first_swap_max = 40

}

export class kswap{
    static mode = "random"
    static tokenIn = "ETH"
    static swap_number_min = 3
    static swap_number_max = 5
    static procent_first_swap_min = 20
    static procent_first_swap_max = 30
}

export class avnu{
    static mode = "random"
    static tokenIn = "ETH"
    static swap_number_min = 1
    static swap_number_max = 2
    static procent_first_swap_min = 60
    static procent_first_swap_max = 70
}

export class starkkVerse{
    static mode = "random"   
    static mintsMin = 1
    static mintsMax = 3
}

export class dmailClass{
    static mode = "random"
    static emailToSendMin = 1          //минимальное количество писем
    static emailToSendMax = 1           //максимальное количество писем
   // static delayMin = 10                 //минимальная задержка 
   // static delayMax = 100                //максимальная задержка
}

export class jediLP{
    static mode = "random"
    static procentMin = 30                  //минимальный % ETH, который будет отправлен в LP
    static procentMax = 65                  //максимальный % ЕТН, который будет отправлен в LP
}

export class zkLendClass{
    static mode = "random"                      
    static borrow = false                   //Если true, то будет ещё занимать/выплачивать
    static procentMin = 15                  //минимальный процент от баланса токена для депозита
    static procentMax = 45                  //максимальный процент от баланса токена для депозита
}

export class starknetId{
    static mode = "random"
    static mintsMin = 1
    static mintsMax = 4
}






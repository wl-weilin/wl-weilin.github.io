
var AccessCode = [
    { "key": "08as", "start": "2023-07-01", "end": "2023-08-30" },
]

loopy(AccessCode)

function isLegal(input, token) {
    const key = token.key;
    const start = new Date(token.start);
    const end = new Date(token.end);
    //获取当前时间
    const currentDate = new Date();

    if (input == key) {
        if (currentDate < start || currentDate > end) {
            return "outdate";
        }
        return "correct";
    }
    return "error";
}

function loopy(AccessCode) {
    var input = null
    var result;

    while (result != "correct") {
        input = prompt("请输入访问码!")

        if (input == null) {  //点击取消
            //go(-1)表示向后移动一页，即返回原页面
            //注意此方法是异步的，调用后最好立即调用return，否则还会继续向下执行
            history.go(-1)
            return
        }

        for (let i = 0; i < AccessCode.length; i++) {
            result = isLegal(input, AccessCode[i]);
            if (result == "outdate" || result == "correct") {
                break;
            }
        }

        if (result == "error") {
            alert("访问码错误！")
        }
        if (result == "outdate") {
            alert("访问码过期！")
        }
    }
}
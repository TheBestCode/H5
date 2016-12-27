/**
 * Created by heyong on 2016/12/22.
 */

function regular() {
    var reg = {
        //邮箱
        email:/^([A-Za-z0-9._%-]+)@([A-Za-z0-9-]+)\.+([A-Za-z]{2,4})$/,
        //url
        url:/^(\w+):\/\/([\w.]+)\/(\S*)$/,
        //手机号码
        mobilePhone:/^1[3|4|5|7|8]\d{9}$/,
        //汉字
        words:/^[\u4e00-\u9fa5]{0,}$/
    }
}
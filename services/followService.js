const Follow = require('../models/folow')

const followUserIds=async(userId)=>{
    try {
        // sacar info de seguiento
        const following = await Follow.find({ user: userId })
        .select('followed')
        
        const followers = await Follow.find({ followed: userId }).select('user');

    //    procesar array de identificadores
        return{
            following: following.map(follow => follow.followed),
            followers: followers.map(follow => follow.user)
        }
    } catch (error) {
        console.error(error)
        throw new Error('Failed to fetch follower user IDs')
    }
}
const followThisUser= async(userId, profileUserId)=>{
    const following = await Follow.findOne({ user: userId  ,followed:profileUserId})
        // .select('followed')
        
    const followers = await Follow.findOne({ user:profileUserId, followed: userId })
        // .select('user');

    return{
        following,
        followers
    }

}
module.exports = {
    followUserIds,
    followThisUser
}
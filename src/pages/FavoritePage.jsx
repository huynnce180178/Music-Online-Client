import React from 'react'
import RecentlyPlayed from '../components/RecentlyPlayed'
import Favorite from '../components/Favorite'

function FavoritePage() {
    return (
        <>
            <Favorite />
            <RecentlyPlayed />
        </>
    )
}

export default FavoritePage
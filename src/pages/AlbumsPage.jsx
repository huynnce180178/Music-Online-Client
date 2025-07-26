import React from 'react'
import FeaturedAlbums from '../components/FeaturedAlbums'
import TrendingAlbums from '../components/TrendingAlbums'
import Top15Albums from '../components/Top15Albums'
import AlbumsByArtists from '../components/AlbumsByArtists'
import NewReleases from '../components/NewReleases'

function AlbumsPage() {
    return (
        <>
            <FeaturedAlbums />
            <TrendingAlbums />
            <Top15Albums />
            <AlbumsByArtists />
            <NewReleases />
        </>
    )
}

export default AlbumsPage
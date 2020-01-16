function getArt() {

    // LocalStorage keys for reference
    const savedResponseKey = 'response';

    // Settings for cache aggressiveness
    const artworksToPrefetch = 50;

    let tombstoneElement;
    let titleElement;
    let artistElement;


    tombstoneElement = document.getElementById('tombstone');
    titleElement = document.getElementById('title');
    artistElement = document.getElementById('artist');
    artworkContainer = document.getElementById('artwork-container');
    imageLink = document.getElementById('imageLink');


    // https://developer.mozilla.org/en-US/docs/Web/API/Storage/getItem
    // ...returns `null` if not found. JSON.parsing `null` also returns `null`
    let savedResponse = JSON.parse(localStorage.getItem(savedResponseKey));

    if (savedResponse !== null) {
        if (savedResponse.data.length > 0) {
            return processResponse(savedResponse);
        }
    }

    getJson('https://aggregator-data.artic.edu/api/v1/search', getQuery(), processResponse);

    function getJson(url, body, callback) {
        let request = new XMLHttpRequest();
        request.open('POST', url, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                callback(JSON.parse(this.responseText));
            }
        };
        request.send(JSON.stringify(body));
    }

    /**
     * Remove one artwork from the response and save it to LocalStorage.
     */
    function processResponse(response) {
        let artwork = response.data[0];
        response.data = response.data.slice(1);
        localStorage.setItem(savedResponseKey, JSON.stringify(response));

        updatePage(artwork);
    }

    function updatePage(artwork) {
        let artistPrint = [artwork.artist_title, artwork.date_display].filter(function (el) {
            return el != null;
        }).join(', ');
        let titlePrint = artwork.title ? artwork.title : "";

        let linkToArtwork = 'https://www.artic.edu/artworks/' + artwork.id + '/' + titleToLink(titlePrint);

        let linkToImage = getIIIFLevel(artwork, 500);

        artistElement.innerHTML = artistPrint;
        titleElement.innerHTML = titlePrint;
        imageLink.setAttribute('src', linkToImage.url)
        tombstoneElement.setAttribute('href', linkToArtwork);
        document.getElementById("artwork-url").setAttribute('href', linkToArtwork);

    }

    //this formats the image url
    //uses iiif: https://openseadragon.github.io/examples/tilesource-legacy/
    function getIIIFLevel(artwork, displayWidth) {
        return {
            url: 'https://www.artic.edu/iiif/2/' + artwork.image_id + '/full/' + displayWidth + ',/0/default.jpg',
            width: displayWidth,
            height: Math.floor(artwork.thumbnail.height * displayWidth / artwork.thumbnail.width),
        };
    }


    function getQuery() {
        return {
            "resources": "artworks",
            "fields": [
                "id",
                "title",
                "artist_title",
                "image_id",
                "date_display",
                "thumbnail"
            ],
            "boost": false,
            "limit": artworksToPrefetch,
            "query": {
                "function_score": {
                    "query": {
                        "bool": {
                            "filter": [
                                {
                                    "term": {
                                        "is_public_domain": true
                                    },
                                },
                                {
                                    "exists": {
                                        "field": "image_id",
                                    },
                                },
                                {
                                    "exists": {
                                        "field": "thumbnail.width",
                                    },
                                },
                                {
                                    "exists": {
                                        "field": "thumbnail.height",
                                    },
                                },
                            ],
                        },
                    },
                    "boost_mode": "replace",
                    "random_score": {
                        "field": "id"
                    },
                },
            },
        };
    }

    function titleToLink(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }


};







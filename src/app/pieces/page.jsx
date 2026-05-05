'use client'
import { Box, Grid, Pagination, } from "@mui/material";
import React from "react";
import SearchBar from "@/components/includes/SearchBar";
import { useState } from "react";
import { useEffect } from "react";
import {
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { db } from "@/firebase";
import Cars from "@/components/product/Cars"

const Accessories = () => {
    const [cars, setCars] = useState([]);
    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const itemsPerPage = 12;
    const [itemOffset, setItemOffset] = useState(0);

    const endOffset = itemOffset + itemsPerPage;
    const currentItems = data.slice(itemOffset, endOffset);
    const pageCount = Math.ceil(data.length / itemsPerPage);

    useEffect(() => {
        const colRef = collection(db, "products");
        const q = query(
            colRef,
            where("status", "==", "validated"),
            where('type', '==', 'accessory'),
            orderBy("createdAt", "desc"),
            limit()
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            let content = [];
            if (snapshot.docs) {
                snapshot.docs.forEach((doc) =>
                    content.push({ id: doc.id, ...doc.data() })
                );
                setCars(content);
                setData(content);
            }
        });

        // Unsubscribe from events when no longer in use
        return () => unsubscribe();
    }, [cars]);

    const searchFilter = (text) => {
        const newData =
            cars &&
            cars.filter((item) => {
                const itemData = item.description
                    ? item.description.toUpperCase()
                    : "".toUpperCase();
                const textData = text.toUpperCase();
                return itemData.indexOf(textData) > -1;
            });
        setSearch(text);
        setData(newData);
        setItemOffset(0);
    };

    const handlePageClick = (event, value) => {
        const newOffset = (value * itemsPerPage) % data.length;
        setItemOffset(newOffset);
    };

    return (
        <main>
            <Grid container sx={{ p: 3 }} spacing={2}>
                <Grid item size={12}>
                    <SearchBar
                        searchFilter={searchFilter}
                        placeholder={"Ex: TOYOTA IST, Suzuki Swift..."}
                    />
                </Grid>
                {currentItems && currentItems.map((car) => <Cars key={car.id} data={car} />)}
                <Grid
                    container
                    direction={"row"}
                    justifyContent={"center"}
                    sx={{ mt: 2 }}
                    item
                    size={12}
                >
                    <Pagination
                        variant="outlined"
                        color="primary"
                        onChange={handlePageClick}
                        count={pageCount}
                    />
                </Grid>
            </Grid>
        </main>
    );
};

export default Accessories;

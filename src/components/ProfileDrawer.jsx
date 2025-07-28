import { Drawer } from "antd";
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';

import ProfilePage from "../pages/ProfilePage";

export default function ProfileDrawer(props) {
    const { t } = useTranslation();
    return (
        <Drawer
            title={<span style={{ color: "#fff" }}>{t('profile.my_profile')}</span>}
            placement="right"
            onClose={props.onClose}
            open={props.open}
            width={window.innerWidth < 600 ? "100%" : 480}
            destroyOnHidden
            styles={{
                body: {
                    padding: 0,
                    background: "#181c2b",
                    height: "100vh"
                },
                header: {
                    background: "#181c2b",
                    color: "#fff",
                    border: "none"
                }
            }}
            closeIcon={<span style={{ color: "#fff", fontSize: 20 }}>&times;</span>}
        >
            <ProfilePage isDrawer onClose={props.onClose} />
        </Drawer>
    );
}

ProfileDrawer.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
